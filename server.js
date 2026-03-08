'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security & CSP headers ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  next();
});

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://thekoshermoor.com',
  'https://www.thekoshermoor.com',
];
if (process.env.DOMAIN) allowedOrigins.push(process.env.DOMAIN);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// ─── Stripe webhook needs raw body ───────────────────────────────────────────
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// ─── JSON & URL-encoded body parsing ─────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files (serves index.html + assets from repo root) ────────────────
app.use(express.static(path.join(__dirname)));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─────────────────────────────────────────────────────────────────────────────
//  STRIPE — Create Checkout Session
//  Called by: STRIPE_CONFIG.checkoutEndpoint → '/create-checkout-session'
// ─────────────────────────────────────────────────────────────────────────────
app.post('/create-checkout-session', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }

  const { priceId, qty, successUrl, cancelUrl } = req.body;

  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
    return res.status(400).json({ error: 'Invalid price ID.' });
  }
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'successUrl and cancelUrl are required.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: Math.max(1, Math.min(Number(qty) || 1, 99)),
        },
      ],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      automatic_tax: { enabled: true },
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('[Stripe] create-checkout-session error:', err.message);
    res.status(500).json({ error: 'Could not create checkout session. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  STRIPE — Create Payment Intent  (PaymentElement / custom UI flow)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }

  const { amount, currency = 'usd', metadata = {} } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) < 50) {
    return res.status(400).json({ error: 'Amount must be at least 50 cents.' });
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(Number(amount)),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'kosher-moor-website',
        ...Object.fromEntries(
          Object.entries(metadata)
            .filter(([k, v]) => typeof k === 'string' && typeof v === 'string')
        ),
      },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('[Stripe] create-payment-intent error:', err.message);
    res.status(500).json({ error: 'Could not create payment intent. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  STRIPE — Confirm Payment  (optional server-side confirmation step)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/confirm-payment', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }

  const { paymentIntentId } = req.body;
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return res.status(400).json({ error: 'paymentIntentId is required.' });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({ status: intent.status, id: intent.id });
  } catch (err) {
    console.error('[Stripe] confirm-payment error:', err.message);
    res.status(500).json({ error: 'Could not confirm payment status.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  STRIPE — Webhook Handler
//  Configure at: https://dashboard.stripe.com/webhooks
//  Endpoint URL:  https://your-domain.com/api/webhook
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/webhook', (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification.');
    return res.sendStatus(200);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log(`[Stripe] Payment succeeded: ${pi.id} — $${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.warn(`[Stripe] Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`[Stripe] Checkout completed: ${session.id} — customer: ${session.customer_email}`);
      break;
    }
    default:
      // Unhandled event type — safe to ignore
      break;
  }

  res.sendStatus(200);
});

// ─────────────────────────────────────────────────────────────────────────────
//  CHAT — Proxy to Anthropic API
//  Keeps the API key server-side; the browser never sees it.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI chat is not configured on this server.' });
  }

  const { messages, system } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  // Sanitise messages — only allow role + content strings
  const safe = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));

  if (safe.length === 0) return res.status(400).json({ error: 'No valid messages provided.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system:     typeof system === 'string' ? system.slice(0, 4000) : undefined,
        messages:   safe,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Chat] Anthropic error:', response.status, errText);
      return res.status(502).json({ error: 'AI service temporarily unavailable.' });
    }

    const data = await response.json();
    res.json({ content: data.content });
  } catch (err) {
    console.error('[Chat] fetch error:', err.message);
    res.status(500).json({ error: 'AI service temporarily unavailable.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT FORM  —  /api/contact
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required.' });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Log the submission (replace with your email/CRM integration)
  console.log('[Contact]', {
    name:    String(name).slice(0, 200),
    email:   String(email).slice(0, 200),
    message: String(message).slice(0, 2000),
    ts:      new Date().toISOString(),
  });

  res.json({ ok: true, message: 'Your message has been received. We will be in touch soon.' });
});

// ─── SPA fallback — serve index.html for any unknown route ──────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n◆ The Kosher Moor server running on port ${PORT}`);
  console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Stripe      : ${process.env.STRIPE_SECRET_KEY ? '✓ configured' : '✗ not configured (set STRIPE_SECRET_KEY)'}`);
  console.log(`  Anthropic   : ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ not configured (set ANTHROPIC_API_KEY)'}`);
  console.log(`  Visit       : http://localhost:${PORT}\n`);
});
