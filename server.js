'use strict';

/**
 * The Kosher Moor — Express Backend Server
 *
 * Provides:
 *  - Stripe Checkout session creation
 *  - Stripe webhook handling (order fulfilment)
 *  - Contact / booking form submission via email
 *
 * Setup:
 *  1. cp .env.example .env  and fill in your real values
 *  2. npm install
 *  3. npm start
 *
 * For GitHub Pages (static-only) deployments this file is not needed.
 * Use Stripe Payment Links instead (stripe.com/payment-links).
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Raw body is required for Stripe webhook signature verification.
// Apply JSON parsing everywhere EXCEPT the webhook route.
app.use((req, res, next) => {
  if (req.path === '/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors({
  origin: process.env.SITE_URL || 'https://thekoshermoor.com',
  methods: ['GET', 'POST'],
}));

// Static assets — css/ and js/ directories only.
// For full static hosting, use GitHub Pages (see README).
const path = require('path');
const root  = path.resolve(__dirname);
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js',  express.static(path.join(root, 'js')));

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Stripe: Create Checkout Session ──────────────────────────────────────────

/**
 * POST /create-checkout-session
 *
 * Body:
 *   { items: [{ name, price, quantity }], customerEmail? }
 *
 * Returns:
 *   { url }  — redirect the browser to this URL
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // convert dollars → cents
      },
      quantity: item.quantity || 1,
    }));

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: process.env.STRIPE_SUCCESS_URL || `${process.env.SITE_URL}/?order=success`,
      cancel_url:  process.env.STRIPE_CANCEL_URL  || `${process.env.SITE_URL}/?order=cancelled`,
      automatic_tax: { enabled: true },
    };

    if (customerEmail) sessionParams.customer_email = customerEmail;

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── Stripe: Webhook ───────────────────────────────────────────────────────────

/**
 * POST /webhook
 *
 * Stripe sends signed events here. Verifying the signature prevents spoofed
 * requests. Set STRIPE_WEBHOOK_SECRET in .env to the secret shown in the
 * Stripe Dashboard → Webhooks page.
 */
app.post('/webhook', (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`✅ Payment received — session ${session.id}, customer ${session.customer_email}`);
      // TODO: trigger order fulfilment (send confirmation email, update CRM, etc.)
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      console.warn(`⚠️  Payment failed — intent ${intent.id}`);
      break;
    }
    default:
      // Unhandled event type — safe to ignore
      break;
  }

  res.json({ received: true });
});

// ── Contact / booking form ────────────────────────────────────────────────────

/**
 * POST /contact
 *
 * Body: { name, email, message, service? }
 *
 * Logs the submission. Wire up nodemailer / SendGrid / EmailJS here as needed.
 */
app.post('/contact', (req, res) => {
  const { name, email, message, service } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  console.log(`📩 Contact form — ${name} <${email}>${service ? ` [${service}]` : ''}: ${message}`);

  // TODO: send email via nodemailer / SendGrid using SMTP_* env vars

  res.json({ success: true, message: 'Message received — we will be in touch shortly.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`The Kosher Moor server running on http://localhost:${PORT}`);
});

module.exports = app;
