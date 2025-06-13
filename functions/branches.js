const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

// Get chat with branches (ownership/shared check)
const getChatWithBranches = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
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
  const userId = userSnap.docs[0].id;
  const { chatid } = req.method === 'GET' ? req.query : req.body;
  if (!chatid) {
    res.status(400).send('Missing chatid');
    return;
  }
  try {
    // Check if chat is shared
    const sharedSnap = await db.collection('shared_chats').doc(chatid).get();
    if (sharedSnap.exists) {
      const sharedData = sharedSnap.data();
      // If shared chat, return branches if present, else fallback to messages
      res.status(200).send({
        chatid,
        model: sharedData.model || '',
        branches: sharedData.branches || {
          root: {
            id: 'root',
            parentMessageId: null,
            messages: sharedData.messages || []
          }
        }
      });
      return;
    }
    // Otherwise, check conversation ownership
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    if (chatData.userId !== userId) {
      res.status(403).send('Not authorized');
      return;
    }
    res.status(200).send({
      chatid,
      model: chatData.model || '',
      branches: chatData.branches || {
        root: {
          id: 'root',
          parentMessageId: null,
          messages: chatData.messages || []
        }
      }
    });
  } catch (err) {
    console.error('getChatWithBranches error', err);
    res.status(500).send('getChatWithBranches error');
  }
});

// Create a new branch from a message
const createBranch = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
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
  const userId = userSnap.docs[0].id;
  const { chatid, parentMessageId, branchId } = req.body;
  if (!chatid || !parentMessageId || !branchId) {
    res.status(400).send('Missing chatid, parentMessageId, or branchId');
    return;
  }
  try {
    // Check if chat is shared
    const sharedSnap = await db.collection('shared_chats').doc(chatid).get();
    if (sharedSnap.exists) {
      // For shared chats, update branches in shared_chats
      const sharedData = sharedSnap.data();
      let baseMessages = sharedData.messages || [];
      let idx = baseMessages.findIndex(m => m.id === parentMessageId || m.messageId === parentMessageId);
      if (idx === -1) {
        idx = baseMessages.findIndex((m, i) => 'msg_' + i === parentMessageId);
      }
      if (idx === -1) {
        res.status(404).send('Parent message not found');
        return;
      }
      const branchMessages = baseMessages.slice(0, idx + 1);
      const newBranch = {
        id: branchId,
        parentMessageId,
        messages: branchMessages
      };
      const branches = sharedData.branches || {
        root: {
          id: 'root',
          parentMessageId: null,
          messages: baseMessages
        }
      };
      branches[branchId] = newBranch;
      await db.collection('shared_chats').doc(chatid).update({ branches });
      res.status(200).send({ branch: newBranch });
      return;
    }
    // Otherwise, check conversation ownership
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    if (chatData.userId !== userId) {
      res.status(403).send('Not authorized');
      return;
    }
    let baseMessages = (chatData.branches && chatData.branches.root && chatData.branches.root.messages) || chatData.messages || [];
    let idx = baseMessages.findIndex(m => m.id === parentMessageId || m.messageId === parentMessageId);
    if (idx === -1) {
      idx = baseMessages.findIndex((m, i) => 'msg_' + i === parentMessageId);
    }
    if (idx === -1) {
      res.status(404).send('Parent message not found');
      return;
    }
    const branchMessages = baseMessages.slice(0, idx + 1);
    const newBranch = {
      id: branchId,
      parentMessageId,
      messages: branchMessages
    };
    const branches = chatData.branches || {
      root: {
        id: 'root',
        parentMessageId: null,
        messages: baseMessages
      }
    };
    branches[branchId] = newBranch;
    await chatRef.update({ branches });
    res.status(200).send({ branch: newBranch });
  } catch (err) {
    console.error('createBranch error', err);
    res.status(500).send('createBranch error');
  }
});

// Add message to a branch
const addMessageToBranch = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
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
  const userId = userSnap.docs[0].id;
  const { chatid, branchId, message } = req.body;
  if (!chatid || !branchId || !message) {
    res.status(400).send('Missing chatid, branchId, or message');
    return;
  }
  try {
    // Check if chat is shared
    const sharedSnap = await db.collection('shared_chats').doc(chatid).get();
    if (sharedSnap.exists) {
      const sharedData = sharedSnap.data();
      const branches = sharedData.branches || {};
      if (!branches[branchId]) {
        res.status(404).send('Branch not found');
        return;
      }
      branches[branchId].messages.push(message);
      await db.collection('shared_chats').doc(chatid).update({ branches });
      res.status(200).send({ branch: branches[branchId] });
      return;
    }
    // Otherwise, check conversation ownership
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    if (chatData.userId !== userId) {
      res.status(403).send('Not authorized');
      return;
    }
    const branches = chatData.branches || {};
    if (!branches[branchId]) {
      res.status(404).send('Branch not found');
      return;
    }
    branches[branchId].messages.push(message);
    await chatRef.update({ branches });
    res.status(200).send({ branch: branches[branchId] });
  } catch (err) {
    console.error('addMessageToBranch error', err);
    res.status(500).send('addMessageToBranch error');
  }
});

// Get messages for a branch
const getBranchMessages = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
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
  const userId = userSnap.docs[0].id;
  const { chatid, branchId } = req.method === 'GET' ? req.query : req.body;
  if (!chatid || !branchId) {
    res.status(400).send('Missing chatid or branchId');
    return;
  }
  try {
    // Check if chat is shared
    const sharedSnap = await db.collection('shared_chats').doc(chatid).get();
    if (sharedSnap.exists) {
      const sharedData = sharedSnap.data();
      const branches = sharedData.branches || {};
      if (!branches[branchId]) {
        res.status(404).send('Branch not found');
        return;
      }
      res.status(200).send({ messages: branches[branchId].messages });
      return;
    }
    // Otherwise, check conversation ownership
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    if (chatData.userId !== userId) {
      res.status(403).send('Not authorized');
      return;
    }
    const branches = chatData.branches || {};
    if (!branches[branchId]) {
      res.status(404).send('Branch not found');
      return;
    }
    res.status(200).send({ messages: branches[branchId].messages });
  } catch (err) {
    console.error('getBranchMessages error', err);
    res.status(500).send('getBranchMessages error');
  }
});

module.exports = {
  getChatWithBranches,
  createBranch,
  addMessageToBranch,
  getBranchMessages,
}; 