const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe product/price cache
let stripeProductId = null;
let stripePriceId = null;

async function ensureStripeProductAndPrice() {
  if (stripeProductId && stripePriceId) return { product: stripeProductId, price: stripePriceId };
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find(p => p.name === 'Premium Subscription');
  if (!product) {
    product = await stripe.products.create({ name: 'Premium Subscription', description: 'Premium access to chat features' });
  }
  stripeProductId = product.id;
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
  let price = prices.data.find(p => p.unit_amount === 900 && p.recurring && p.recurring.interval === 'month');
  if (!price) {
    price = await stripe.prices.create({ product: product.id, unit_amount: 900, currency: 'usd', recurring: { interval: 'month' } });
  }
  stripePriceId = price.id;
  return { product: stripeProductId, price: stripePriceId };
}

const createCheckoutSession = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { userId } = req.body;
  if (!userId) {
    res.status(400).send('Missing userId');
    return;
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    res.status(403).send('Invalid user');
    return;
  }
  const userData = userSnap.data();
  let stripeCustomerId = userData.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: { firebaseUID: userId },
      email: userData.email || undefined
    });
    stripeCustomerId = customer.id;
    await userRef.set({ stripeCustomerId }, { merge: true });
  }
  const { price } = await ensureStripeProductAndPrice();
  const baseUrl = process.env.HOST || 'http://localhost:3000/settings';
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price, quantity: 1 }],
    mode: 'subscription',
    success_url: `${baseUrl}/settings?success=1`,
    cancel_url: `${baseUrl}/settings?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { firebaseUID: userId }
    }
  });
  res.status(200).json({ url: session.url });
});

const createCustomerPortalSession = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const { userId } = req.body;
  if (!userId) {
    res.status(400).send('Missing userId');
    return;
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    res.status(403).send('Invalid user');
    return;
  }
  const userData = userSnap.data();
  const stripeCustomerId = userData.stripeCustomerId;
  if (!stripeCustomerId) {
    res.status(400).send('No Stripe customer');
    return;
  }
  const baseUrl = process.env.HOST || 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/settings`
  });
  res.status(200).json({ url: session.url });
});

const stripeWebhook = onRequest({ region: 'europe-west1', rawBody: true }, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  if (!req.rawBody || !(req.rawBody instanceof Buffer)) {
    console.error('Stripe webhook: req.rawBody is missing or not a Buffer');
    res.status(400).send('Webhook Error: rawBody not available');
    return;
  }
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  const db = admin.firestore();
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free';
    const userSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (!userSnap.empty) {
      const userRef = userSnap.docs[0].ref;
      await userRef.set({ status, subscriptionId: subscription.id }, { merge: true });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const userSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (!userSnap.empty) {
      const userRef = userSnap.docs[0].ref;
      await userRef.set({ status: 'free', subscriptionId: null }, { merge: true });
    }
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    if (customerId && subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free';
        const userSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
        if (!userSnap.empty) {
          const userRef = userSnap.docs[0].ref;
          await userRef.set({ status, subscriptionId }, { merge: true });
        }
      } catch (err) {
        console.error('Failed to fetch subscription in checkout.session.completed:', err.message);
      }
    }
  }
  res.status(200).send('Received');
});

module.exports = {
  createCheckoutSession,
  createCustomerPortalSession,
  stripeWebhook,
}; 