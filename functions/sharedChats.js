const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

// Create a shared chat
const createSharedChat = onRequest({ region: 'europe-west1' }, async (req, res) => {
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
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { chatid } = req.body;
  if (!chatid) {
    res.status(400).send('Missing chatid');
    return;
  }
  try {
    // Check if chatid is already a shared chat
    const sharedRef = db.collection('shared_chats').doc(chatid);
    const sharedSnap = await sharedRef.get();
    if (sharedSnap.exists) {
      res.status(200).send({ sharedId: chatid });
      return;
    }
    // Otherwise, get the conversation
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    // Check if a shared chat with the same messages already exists
    const sharedQuery = await db.collection('shared_chats')
      .where('model', '==', chatData.model || '')
      .get();
    let foundId = null;
    for (const doc of sharedQuery.docs) {
      const d = doc.data();
      if (JSON.stringify(d.messages) === JSON.stringify(chatData.messages || [])) {
        foundId = doc.id;
        break;
      }
    }
    if (foundId) {
      res.status(200).send({ sharedId: foundId });
      return;
    }
    // Create new shared chat
    const newSharedRef = await db.collection('shared_chats').add({
      messages: chatData.messages || [],
      model: chatData.model || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send({ sharedId: newSharedRef.id });
  } catch (err) {
    console.error('createSharedChat error', err);
    res.status(500).send('createSharedChat error');
  }
});

module.exports = {
  createSharedChat,
}; 