const { onRequest } = require('firebase-functions/v2/https');
const OpenAI = require('openai');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

const chatNameFromMessage = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
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
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { chatid, message } = req.body;
  if (!chatid || !message) {
    res.status(400).send('Missing chatid or message');
    return;
  }
  try {
    const chatRef = db.collection('conversations').doc(chatid);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      res.status(404).send('Chat not found');
      return;
    }
    const chatData = chatSnap.data();
    if (chatData.name && chatData.name.trim() !== '') {
      res.status(200).send({ name: chatData.name });
      return;
    }
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || '',
        'X-Title': process.env.OPENROUTER_TITLE || '',
      },
    });
    const prompt = [
      { role: 'system', content: 'You are a helpful assistant that creates short, descriptive chat names (max 5 words) based on the user\'s first message. Respond with only the chat name.' },
      { role: 'user', content: message }
    ];
    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: prompt,
      max_tokens: 16,
      temperature: 0.7,
    });
    let chatName = '';
    if (completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) {
      chatName = completion.choices[0].message.content.trim();
    }
    if (!chatName) chatName = 'New Chat';
    await chatRef.update({ name: chatName });
    res.status(200).send({ name: chatName });
  } catch (err) {
    console.error('chatNameFromMessage error', err);
    res.status(500).send('chatNameFromMessage error');
  }
});

module.exports = {
  chatNameFromMessage,
}; 