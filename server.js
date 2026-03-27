require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const app = express()

app.use(cors({ origin: '*' }))

// Webhook route - must be before json parser
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return res.json({ received: true })
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret)
  } catch (err) {
    return res.status(400).send('Webhook Error: ' + err.message)
  }
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    console.log('Payment succeeded:', pi.id)
  }
  res.json({ received: true })
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Payment route
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const { cart, customerEmail, firstName } = req.body
    if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty.' })
    let total = 0
    for (const item of cart) {
      total += parseFloat(item.price || 0) * item.qty
    }
    const amount = Math.round(total * 100)
    if (amount < 50) return res.status(400).json({ error: 'Order total too low.' })
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: {
        cart_json: JSON.stringify(cart),
        customer_email: customerEmail || '',
        customer_name: firstName || ''
      }
    })
    res.json({ clientSecret: paymentIntent.client_secret, amount: total })
  } catch (err) {
    console.error('Payment error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'The Kosher Moor', timestamp: new Date().toISOString() })
})

// Serve frontend
app.use(express.static(path.join(__dirname, '.')))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' })
  res.sendFile(path.join(__dirname, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('The Kosher Moor running on port ' + PORT))
module.exports = app
