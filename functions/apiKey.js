const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');

const ENCRYPTION_SECRET = process.env.API_KEY_SECRET || 'default_secret_32_bytes_long!';
const ENCRYPTION_ALGO = 'aes-256-cbc';
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_SECRET, 'utf8').slice(0, 32), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

const saveApiKey = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  const { userId, apiKey } = req.body;
  if (!userId) {
    res.status(401).send('Missing userId');
    return;
  }
  if (!apiKey) {
    res.status(400).send('Missing apiKey');
    return;
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    res.status(404).send('User not found');
    return;
  }
  const encrypted = encrypt(apiKey);
  await userRef.set({ openrouterApiKey: encrypted, useOwnKey: true }, { merge: true });
  res.status(200).json({ success: true });
});

module.exports = {
  saveApiKey,
}; 