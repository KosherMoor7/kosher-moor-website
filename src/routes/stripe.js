// src/routes/stripe.js
// Creates Stripe PaymentIntents for the Payment Element flow
'use strict';

const express = require('express');
const router  = express.Router();

let stripe;
function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('YOUR_')) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripe = require('stripe')(key);
  }
  return stripe;
}

// POST /api/stripe/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || typeof amount !== 'number' || amount < 50) {
      return res.status(400).json({ error: 'amount must be a number >= 50 (cents)' });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount:   Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { source: 'the-kosher-moor' },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping verification');
    return res.json({ received: true });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.warn('PaymentIntent failed:', event.data.object.id);
      break;
    default:
      // Ignore unhandled event types
  }

  res.json({ received: true });
});

module.exports = router;
