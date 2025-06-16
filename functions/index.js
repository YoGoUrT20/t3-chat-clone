/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const OpenAI = require('openai');
const admin = require('firebase-admin');
const branches = require('./branches');
const sharedChats = require('./sharedChats');
const { chatNameFromMessage } = require('./chatNameFromMessage');
const { models } = require('./models');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
// STRIPE: Import all Stripe endpoints from new file
const stripeEndpoints = require('./stripe');
const apiKeyEndpoints = require('./apiKey');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

if (!admin.apps.length) admin.initializeApp();


exports.chatNameFromMessage = chatNameFromMessage;

exports.createSharedChat = sharedChats.createSharedChat;

// Get chat with branches (ownership/shared check)
exports.getChatWithBranches = branches.getChatWithBranches;

// Create a new branch from a message
exports.createBranch = branches.createBranch;

// Add message to a branch
exports.addMessageToBranch = branches.addMessageToBranch;

// Get messages for a branch
exports.getBranchMessages = branches.getBranchMessages;

const ENCRYPTION_SECRET = process.env.API_KEY_SECRET;
const ENCRYPTION_ALGO = 'aes-256-cbc';


function decrypt(encrypted) {
  const [ivBase64, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGO,
    Buffer.from(ENCRYPTION_SECRET, 'utf8').slice(0, 32),
    iv
  );
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

exports.saveApiKey = apiKeyEndpoints.saveApiKey;

function debugStream(label, state) {
  console.log(`[BACKEND STREAM DEBUG] ${label}:`, JSON.stringify(state));
}

async function bufferToken(streamId, token) {
  debugStream('bufferToken', { streamId, token });
  const ref = admin.firestore().collection('streams').doc(streamId);
  await ref.set({
    tokens: admin.firestore.FieldValue.arrayUnion(token),
    finished: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function markStreamFinished(streamId) {
  debugStream('markStreamFinished', { streamId });
  const ref = admin.firestore().collection('streams').doc(streamId);
  await ref.set({ finished: true }, { merge: true });
}

exports.llmStreamResumable = onRequest({ region: 'europe-west1' }, async (req, res) => {
  // Accepts requests with or without chat_id. If chat_id is not provided, generates a temporary id for stream persistence.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const defaultApiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!defaultApiKey) {
    res.status(500).send('Server misconfiguration: missing OpenRouter API key');
    return;
  }
  const userApiKey = req.get('x-api-key');
  if (!userApiKey) {
    res.status(401).send('Missing API key');
    return;
  }
  const db = admin.firestore();
  const userSnap = await db.collection('users').where('apiKey', '==', userApiKey).limit(1).get();
  if (userSnap.empty) {
    res.status(403).send('Invalid API key');
    return;
  }
  const userRef = userSnap.docs[0].ref;
  const userData = userSnap.docs[0].data();
  let userSystemPrompt = userData.systemPrompt;
  const preferredLanguage = userData.preferredLanguage;
  let systemPromptParts = [];
  const selectedModel = models.find(m => m.openRouterName === req.body.model);
  if (selectedModel) {
    systemPromptParts.push('You are ' + (selectedModel.displayName || selectedModel.openRouterName) + " model. You are operating at Quiver AI - A chat allowing seamless transition between different AI models.");
  }
  systemPromptParts.push('Today\'s UTC date: ' + new Date().toISOString().slice(0, 10) + '.');
  if (preferredLanguage && typeof preferredLanguage === 'string' && preferredLanguage.trim() !== '') {
    systemPromptParts.push('User preferred language: ' + preferredLanguage.trim() + '.');
  }
  if (userSystemPrompt && typeof userSystemPrompt === 'string' && userSystemPrompt.trim() !== '') {
    systemPromptParts.push(userSystemPrompt.trim());
  }
  let finalSystemPrompt = systemPromptParts.join(' ');

  let apiKeyToUse = defaultApiKey;
  if (userData.useOwnKey && userData.openrouterApiKey) {
    try {
      apiKeyToUse = decrypt(userData.openrouterApiKey);
    } catch (e) {
      res.status(500).send('Failed to decrypt user OpenRouter API key');
      return;
    }
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKeyToUse,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_REFERER || '',
      'X-Title': process.env.OPENROUTER_TITLE || '',
    },
  });
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { model, messages } = req.body;
  if (!model || !messages) {
    res.status(400).send('Missing model or messages');
    return;
  }
  let streamId = req.body.chat_id;
  if (!streamId) {
    // Generate a temporary stream id for cases like reroll or branch streaming
    streamId = `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }
  const allowedModelNames = models.map(m => m.openRouterName);
  if (!allowedModelNames.includes(model)) {
    res.status(400).json({ error: 'invalid_model', message: 'Requested model is not available.' });
    return;
  }
  if (selectedModel.apiKeyRequired && (!userData.apiKey || userData.apiKey.trim() === '')) {
    res.status(403).json({ error: 'api_key_required', message: 'This model requires an API key.' });
    return;
  }
  // Only enforce premium check if NOT using own OpenRouter API key
  const usingOwnKey = userData.useOwnKey && userData.openrouterApiKey;
  if (!selectedModel.freeAccess && !usingOwnKey) {
    if (userData.status !== 'premium' || !userData.premiumTokens || userData.premiumTokens <= 0) {
      res.status(403).json({ error: 'premium_required', message: 'This model requires premium status and available premium tokens.' });
      return;
    }
    await userRef.set({ premiumTokens: admin.firestore.FieldValue.increment(-1) }, { merge: true });
  }
  let newMessages = messages;
  if (finalSystemPrompt !== '') {
    if (messages.length > 0 && messages[0].role === 'system') {
      newMessages = [
        { role: 'system', content: finalSystemPrompt + ' ' + (messages[0].content || '') },
        ...messages.slice(1)
      ];
    } else {
      newMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...messages
      ];
    }
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Use streamId as the stream key
  const streamRef = db.collection('streams').doc(streamId);
  await streamRef.set({ tokens: [], finished: false, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  let totalUsage = null;
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: newMessages,
      stream: true,
    });
    // Do not save user message to Firestore; frontend is responsible for this
    let conversationRef = null;
    if (req.body.chat_id) {
      conversationRef = db.collection('conversations').doc(req.body.chat_id);
    }
    for await (const chunk of stream) {
      if (chunk.usage) {
        totalUsage = chunk.usage;
      }
      await bufferToken(streamId, chunk);
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      let reasoning = null;
      if (chunk.choices && chunk.choices[0]) {
        if (chunk.choices[0].delta && chunk.choices[0].delta.reasoning) {
          reasoning = chunk.choices[0].delta.reasoning;
        } else if (chunk.choices[0].message && chunk.choices[0].message.reasoning) {
          reasoning = chunk.choices[0].message.reasoning;
        }
      }
      if (reasoning !== null) {
        res.write(`data: ${JSON.stringify({ reasoning })}\n\n`);
      }
    }
    await markStreamFinished(streamId);
    res.end();
    if (totalUsage) {
      const promptTokens = totalUsage.prompt_tokens || 0;
      const completionTokens = totalUsage.completion_tokens || 0;
      const totalTokens = totalUsage.total_tokens || (promptTokens + completionTokens);
      await userRef.set({
        totalTokens: admin.firestore.FieldValue.increment(totalTokens),
        totalMessages: admin.firestore.FieldValue.increment(1),
        totalImages: admin.firestore.FieldValue.increment(0),
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens
      }, { merge: true });
    } else {
      await userRef.set({
        totalMessages: admin.firestore.FieldValue.increment(1),
      }, { merge: true });
    }
    // Save assistant message to Firestore if chat_id is provided
    if (conversationRef && req.body.chat_id) {
      // Compose the assistant message from the streamed tokens
      const streamDoc = await streamRef.get();
      let assistantText = '';
      if (streamDoc.exists && streamDoc.data().tokens) {
        for (const token of streamDoc.data().tokens) {
          const text =
            (token.reasoning) ||
            (token.content) ||
            (token.choices && token.choices[0] && token.choices[0].delta && token.choices[0].delta.content);
          if (text) assistantText += text;
        }
      }
      // Only append assistant message if non-empty and not duplicate
      if (assistantText.trim().length > 0) {
        const convSnap = await conversationRef.get();
        const convData = convSnap.data();
        const lastMsg = (convData.messages && convData.messages.length > 0) ? convData.messages[convData.messages.length - 1] : null;
        if (!lastMsg || lastMsg.content !== assistantText || lastMsg.role !== 'assistant') {
          await conversationRef.update({
            messages: admin.firestore.FieldValue.arrayUnion({
              role: 'assistant',
              content: assistantText,
              model: model
            }),
            lastUsed: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    }
  } catch (err) {
    await markStreamFinished(streamId);
    res.status(500).send('LLM stream error');
  }
});

// New endpoint to get/resume ongoing stream for a chat
exports.getOngoingStream = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const { chat_id } = req.query;
  if (!chat_id) {
    res.status(400).send('Missing chat_id');
    return;
  }
  const db = admin.firestore();
  const streamRef = db.collection('streams').doc(chat_id);
  const streamDoc = await streamRef.get();
  if (!streamDoc.exists) {
    res.status(404).send('No ongoing stream');
    return;
  }
  const data = streamDoc.data();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Stream all tokens
  for (const token of data.tokens || []) {
    res.write(`data: ${JSON.stringify(token)}\n\n`);
  }
  if (data.finished) {
    res.end();
    return;
  }
  // Poll for new tokens for up to 30 seconds
  let lastLen = (data.tokens || []).length;
  let waited = 0;
  while (waited < 30000) {
    await new Promise(r => setTimeout(r, 100));
    waited += 100;
    const snap = await streamRef.get();
    const tks = (snap.data() && snap.data().tokens) || [];
    for (let i = lastLen; i < tks.length; i++) {
      res.write(`data: ${JSON.stringify(tks[i])}\n\n`);
    }
    lastLen = tks.length;
    if (snap.data() && snap.data().finished) {
      res.end();
      return;
    }
  }
  res.end();
});

// STRIPE: Re-export endpoints
exports.createCheckoutSession = stripeEndpoints.createCheckoutSession;
exports.createCustomerPortalSession = stripeEndpoints.createCustomerPortalSession;
exports.stripeWebhook = stripeEndpoints.stripeWebhook;
