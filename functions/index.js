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

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

if (!admin.apps.length) admin.initializeApp();

exports.llmStream = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    console.error('OpenRouter API key is missing in environment variables');
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
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
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
  // Model validation
  const allowedModelNames = models.map(m => m.openRouterName);
  if (!allowedModelNames.includes(model)) {
    res.status(400).json({ error: 'invalid_model', message: 'Requested model is not available.' });
    return;
  }
  // Check if model requires API key
  if (selectedModel.apiKeyRequired && (!userData.apiKey || userData.apiKey.trim() === '')) {
    res.status(403).json({ error: 'api_key_required', message: 'This model requires an API key.' });
    return;
  }
  // Check if model is not free (premium)
  if (!selectedModel.freeAccess) {
    if (userData.status !== 'premium' || !userData.premiumTokens || userData.premiumTokens <= 0) {
      res.status(403).json({ error: 'premium_required', message: 'This model requires premium status and available premium tokens.' });
      return;
    }
    // Decrement premiumTokens by 1
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
  let totalUsage = null;
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: newMessages,
      stream: true,
    });
    for await (const chunk of stream) {
      if (chunk.usage) {
        totalUsage = chunk.usage;
      }
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
  } catch (err) {
    console.error('LLM stream error', err);
    if (err && (err.status === 429 || err.code === 429) && err.error && typeof err.error.message === 'string' && err.error.message.includes('Rate limit exceeded')) {
      res.status(429).json({
        error: 'rate_limit',
        message: 'Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day'
      });
      return;
    }
    res.status(500).send('LLM stream error');
  }
});

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
