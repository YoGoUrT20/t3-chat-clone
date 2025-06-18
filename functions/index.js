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

// Add or update premiumTokens on premium status
const setPremiumTokensIfNeeded = async (userRef, userData) => {
  if (userData.status === 'premium') {
    if (!userData.premiumTokens || typeof userData.premiumTokens !== 'number' || userData.premiumTokens < 0) {
      await userRef.set({ premiumTokens: 50 }, { merge: true })
    }
  }
}

exports.llmStreamResumable = onRequest({ region: 'europe-west1' }, async (req, res) => {
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
  const db = admin.firestore();
  let userRef = null;
  let userData = null;

  if (userApiKey) {
    const userSnap = await db.collection('users').where('apiKey', '==', userApiKey).limit(1).get();
    if (userSnap.empty) {
      res.status(403).send('Invalid API key');
      return;
    }
    userRef = userSnap.docs[0].ref;
    userData = userSnap.docs[0].data();
    await setPremiumTokensIfNeeded(userRef, userData);
  }
  
  let userSystemPrompt = userData?.systemPrompt;
  const preferredLanguage = userData?.preferredLanguage;
  let systemPromptParts = [];
  const selectedModel = models.find(m => m.openRouterName === req.body.model);
  if (selectedModel) {
    systemPromptParts.push('You are ' + (selectedModel.displayName || selectedModel.openRouterName) + ' model. You are operating at Quiver AI - A chat allowing seamless transition between different AI models.');
  }
  systemPromptParts.push(`Today's UTC date: ` + new Date().toISOString().slice(0, 10) + '.');
  if (preferredLanguage && typeof preferredLanguage === 'string' && preferredLanguage.trim() !== '') {
    systemPromptParts.push('User preferred language: ' + preferredLanguage.trim() + '.');
  }
  if (userSystemPrompt && typeof userSystemPrompt === 'string' && userSystemPrompt.trim() !== '') {
    systemPromptParts.push(userSystemPrompt.trim());
  }
  let finalSystemPrompt = systemPromptParts.join(' ');

  let apiKeyToUse = defaultApiKey;
  if (userData?.useOwnKey && userData?.openrouterApiKey) {
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
  const { model, messages, images, branchId } = req.body;
  if (!model || !messages) {
    res.status(400).send('Missing model or messages');
    return;
  }
  let streamId = req.body.chat_id;
  if (!streamId) {
    streamId = `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }
  // Find the user message to get/generate messageid
  let userMsg = messages.find(m => m.role === 'user');
  // Always generate a new assistant message id for the stream and for the conversation
  let assistantMessageId = uuidv4();
  const allowedModelNames = models.map(m => m.openRouterName);
  if (!allowedModelNames.includes(model)) {
    res.status(400).json({ error: 'invalid_model', message: 'Requested model is not available.' });
    return;
  }
  if (selectedModel.apiKeyRequired && (!userData?.apiKey || userData.apiKey.trim() === '')) {
    res.status(403).json({ error: 'api_key_required', message: 'This model requires an API key.' });
    return;
  }
  const usingOwnKey = userData?.useOwnKey && userData?.openrouterApiKey;
  if (!selectedModel.freeAccess && !usingOwnKey) {
    if (!userData || userData.status !== 'premium' || !userData.premiumTokens || userData.premiumTokens <= 0) {
      res.status(403).json({ error: 'premium_required', message: 'This model requires premium status and available premium tokens.' });
      return;
    }
    await userRef.set({ premiumTokens: admin.firestore.FieldValue.increment(-1) }, { merge: true });
  }
  // Web search deduction logic
  const hasWebSearch = (
    (typeof model === 'string' && model.endsWith(':online')) ||
    (req.body && (
      req.body.plugins && Array.isArray(req.body.plugins) && req.body.plugins.some(p => p.id === 'web') ||
      req.body.web_search_options ||
      req.body.useWebSearch === true
    ))
  );
  // If useWebSearch param is true, ensure plugin is set and deduct 3 tokens
  let webSearchPluginAdded = false;
  if (req.body.useWebSearch === true) {
    if (!req.body.plugins || !Array.isArray(req.body.plugins)) {
      req.body.plugins = [];
    }
    if (!req.body.plugins.some(p => p.id === 'web')) {
      req.body.plugins.push({ id: 'web' });
      webSearchPluginAdded = true;
    }
  }
  if (hasWebSearch && !usingOwnKey) {
    // If useWebSearch, deduct 3 tokens, otherwise 2 (legacy logic)
    const tokensToDeduct = req.body.useWebSearch === true ? 3 : 2;
    if (!userData || userData.status !== 'premium' || !userData.premiumTokens || userData.premiumTokens < tokensToDeduct) {
      res.status(403).json({ error: 'premium_required', message: `Web search requires premium status and at least ${tokensToDeduct} premium tokens.` });
      return;
    }
    await userRef.set({ premiumTokens: admin.firestore.FieldValue.increment(-tokensToDeduct) }, { merge: true });
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
  let visionAllowed = selectedModel && Array.isArray(selectedModel.capabilities) && selectedModel.capabilities.includes('vision');
  let imagesToSend = [];
  let pdfsToSend = [];
  if (images && images.length > 0) {
    if (!visionAllowed) {
      res.status(400).json({ error: 'vision_not_supported', message: 'This model does not support image or file input.' });
      return;
    }
    for (const file of images) {
      if (!file || !file.data || !file.type || !file.name) {
        res.status(400).json({ error: 'invalid_file', message: 'Invalid file format.' });
        return;
      }
      if (file.type.startsWith('image/')) {
        imagesToSend.push({
          type: file.type,
          name: file.name,
          data: file.data
        });
      } else if (file.type === 'application/pdf') {
        pdfsToSend.push({
          type: file.type,
          name: file.name,
          data: file.data
        });
      } else {
        res.status(400).json({ error: 'invalid_file_type', message: 'Only image and PDF files are supported.' });
        return;
      }
    }
  }
  if (visionAllowed && (imagesToSend.length > 0 || pdfsToSend.length > 0)) {
    let userMsgIdx = newMessages.findIndex(m => m.role === 'user');
    if (userMsgIdx !== -1) {
      let origContent = newMessages[userMsgIdx].content;
      let textContent = '';
      if (typeof origContent === 'string') {
        textContent = origContent;
      } else if (Array.isArray(origContent)) {
        let textObj = origContent.find(c => c.type === 'text');
        textContent = textObj ? textObj.text : '';
      }
      let contentArr = [];
      if (textContent && textContent.length > 0) {
        contentArr.push({ type: 'text', text: textContent });
      }
      for (const img of imagesToSend) {
        contentArr.push({
          type: 'image_url',
          image_url: { url: img.data }
        });
      }
      for (const pdf of pdfsToSend) {
        contentArr.push({
          type: 'file',
          file: { filename: pdf.name, file_data: pdf.data }
        });
      }
      newMessages[userMsgIdx].content = contentArr;
    }
  }
  if (req.body.chat_id && newMessages.length > 0 && !req.body.isReroll) {
    const conversationRef = db.collection('conversations').doc(req.body.chat_id);
    const userMsg = newMessages[newMessages.length - 1];
    
    if (userMsg && userMsg.role === 'user' && !(Array.isArray(userMsg.content))) {
      userMsg.id = userMsg.id || uuidv4();
      if (branchId) {
        const branchUpdate = {};
        branchUpdate[`branches.${branchId}.messages`] = admin.firestore.FieldValue.arrayUnion(userMsg);
        await conversationRef.update(branchUpdate);
      } else {
        await conversationRef.update({
          messages: admin.firestore.FieldValue.arrayUnion(userMsg),
          lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const streamRef = db.collection('streams').doc(streamId);
  // Initialize the stream doc with message, chatid, messageid, finished
  await streamRef.set({
    message: '',
    tokens: [],
    chatid: streamId,
    messageid: assistantMessageId,
    model: req.body.model,
    finished: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  let totalUsage = null;
  let thinkingContent = '';
  let mainContent = '';
  try {
    const payload = {
      model,
      messages: newMessages,
      stream: true,
    };

    // Add web plugin if useWebSearch is true
    if (req.body.useWebSearch === true) {
      if (!payload.plugins) payload.plugins = [];
      if (!payload.plugins.some(p => p.id === 'web')) {
        payload.plugins.push({ id: 'web', max_results: 1, search_context_size: 'low', max_tokens: '2000' });
      } else {
        // If web plugin is present, enforce the options
        payload.plugins = payload.plugins.map(p =>
          p.id === 'web' ? { ...p, max_results: 1, search_context_size: 'low', max_tokens: '2000' } : p
        );
      }
      // Always set web_search_options as well
      payload.web_search_options = {
        max_results: 1,
        search_context_size: 'low',
        max_tokens: '2000'
      };
    }
    if (pdfsToSend.length > 0) {
      if (!payload.plugins) payload.plugins = [];
      payload.plugins.push({
        id: 'file-parser',
        pdf: {
          engine: 'pdf-text',
        },
      });
    }

    const stream = await openai.chat.completions.create(payload);
    let conversationRef = null;
    if (req.body.chat_id) {
      conversationRef = db.collection('conversations').doc(req.body.chat_id);
    }
    for await (const chunk of stream) {
      if (chunk.usage) {
        totalUsage = chunk.usage;
      }
      
      let text = '';
      let reasoning = null;

      if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.reasoning) {
        reasoning = chunk.choices[0].delta.reasoning;
      } else if (chunk.reasoning) {
        reasoning = chunk.reasoning;
      }
      
      if (chunk.content) {
        text = chunk.content;
      } else if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
        text = chunk.choices[0].delta.content;
      }

      if (reasoning) {
        thinkingContent += reasoning;
      }
      if (text) {
        mainContent += text;
      }

      let currentMessage = '';
      if (thinkingContent) {
        currentMessage = `<thinking>${thinkingContent}</thinking>${mainContent}`;
      } else {
        currentMessage = mainContent;
      }
      await streamRef.update({
          message: currentMessage,
          tokens: admin.firestore.FieldValue.arrayUnion(chunk)
      });

      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    await streamRef.update({ finished: true });
    res.end();
    if (totalUsage) {
      const promptTokens = totalUsage.prompt_tokens || 0;
      const completionTokens = totalUsage.completion_tokens || 0;
      const totalTokens = totalUsage.total_tokens || (promptTokens + completionTokens);
      // Only increment totalImages if the model is an image generation model
      // Imagen to be implemented.. :(
      const imageGenModelNames = ['openai/gpt-imagegen'];
      const isImageGenModel = imageGenModelNames.includes(model);
      if (userRef) {
        await userRef.set({
          totalTokens: admin.firestore.FieldValue.increment(totalTokens),
          totalMessages: admin.firestore.FieldValue.increment(1),
          totalImages: isImageGenModel ? admin.firestore.FieldValue.increment(imagesToSend.length) : admin.firestore.FieldValue.increment(0),
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens
        }, { merge: true });
      }
    } else {
      if (userRef) {
        await userRef.set({
          totalMessages: admin.firestore.FieldValue.increment(1),
        }, { merge: true });
      }
    }
    if (conversationRef && req.body.chat_id) {
      const streamDoc = await streamRef.get();
      let assistantText = '';
      if (streamDoc.exists && streamDoc.data().message) {
        assistantText = streamDoc.data().message;
      }
      if (assistantText.trim().length > 0) {
        const assistantMessage = {
          role: 'assistant',
          content: assistantText,
          model: model,
          id: assistantMessageId
        };
        const { branchId } = req.body;
        // REROLL REPLACE LOGIC
        if (req.body.isReroll && req.body.rerollMsgId) {
          const convSnap = await conversationRef.get();
          const convData = convSnap.data();
          if (branchId) {
            // Replace in branch
            const branch = convData.branches && convData.branches[branchId];
            if (branch && Array.isArray(branch.messages)) {
              const newBranchMessages = branch.messages.map(msg =>
                msg.id === req.body.rerollMsgId ? { ...assistantMessage, id: req.body.rerollMsgId } : msg
              );
              const branchUpdate = {};
              branchUpdate[`branches.${branchId}.messages`] = newBranchMessages;
              branchUpdate['lastUsed'] = admin.firestore.FieldValue.serverTimestamp();
              await conversationRef.update(branchUpdate);
            }
          } else {
            // Replace in main messages
            if (Array.isArray(convData.messages)) {
              const newMessages = convData.messages.map(msg =>
                msg.id === req.body.rerollMsgId ? { ...assistantMessage, id: req.body.rerollMsgId } : msg
              );
              await conversationRef.update({
                messages: newMessages,
                lastUsed: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        } else {
          // Default: append as usual
          if (branchId) {
            const branchUpdate = {};
            branchUpdate[`branches.${branchId}.messages`] = admin.firestore.FieldValue.arrayUnion(assistantMessage);
            branchUpdate['lastUsed'] = admin.firestore.FieldValue.serverTimestamp();
            await conversationRef.update(branchUpdate);
          } else {
            const convSnap = await conversationRef.get();
            const convData = convSnap.data();
            const lastMsg = (convData.messages && convData.messages.length > 0) ? convData.messages[convData.messages.length - 1] : null;
            if (!lastMsg || lastMsg.id !== assistantMessageId) {
              await conversationRef.update({
                messages: admin.firestore.FieldValue.arrayUnion(assistantMessage),
                lastUsed: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    await streamRef.update({ finished: true });
    console.error('llmStreamResumable error:', err && err.stack ? err.stack : err);
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
