
// src/routes/stripe.js
const express = require('express')
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')
const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/stripe/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { cart, customerEmail, firstName, shippingAddress } = req.body

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }

    const realItems = cart.filter(i => !String(i.id).startsWith('demo-'))
    const demoItems = cart.filter(i =>  String(i.id).startsWith('demo-'))

    let verifiedCart = []
    let serverTotal  = 0

    if (realItems.length > 0) {
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select('id, name, price, stock, is_digital, icon')
        .in('id', realItems.map(i => i.id))
        .eq('active', true)

      if (dbError) {
        return res.status(500).json({ error: 'Could not verify product prices.' })
      }

      for (const cartItem of realItems) {
        const product = products.find(p => p.id === cartItem.id)
        if (!product) {
          return res.status(400).json({ error: 'A product is no longer available.' })
        }
        if (!product.is_digital && product.stock < cartItem.qty) {
          return res.status(400).json({ error: `Not enough stock for: ${product.name}` })
        }
        serverTotal += product.price * cartItem.qty
        verifiedCart.push({
          id: product.id, name: product.name,
          icon: product.icon || '📦', price: product.price,
          qty: cartItem.qty, is_digital: product.is_digital
        })
      }
    }

    for (const item of demoItems) {
      serverTotal += parseFloat(item.price || 0) * item.qty
      verifiedCart.push({
        id: item.id, name: item.name,
        icon: item.icon || '📦', price: parseFloat(item.price) || 0,
        qty: item.qty, is_digital: false
      })
    }

    const amountInCents = Math.round(serverTotal * 100)
    if (amountInCents < 50) {
      return res.status(400).json({ error: 'Order total is too low.' })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: {
        cart_json:        JSON.stringify(verifiedCart),
        customer_email:   customerEmail   || '',
        customer_name:    firstName       || '',
        shipping_address: shippingAddress || ''
      }
    })

    console.log(`[Stripe] PaymentIntent: ${paymentIntent.id} — $${serverTotal.toFixed(2)}`)
    res.json({ clientSecret: paymentIntent.client_secret, amount: serverTotal })

  } catch (err) {
    console.error('[Stripe] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set')
    return res.json({ received: true })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi   = event.data.object
    const cart = JSON.parse(pi.metadata.cart_json || '[]')
    const email = pi.metadata.customer_email
    const firstName = pi.metadata.customer_name

    // Upsert customer
    if (email) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single()

      let customerId = existing?.id

      if (!customerId) {
        const { data: newC } = await supabase
          .from('customers')
          .insert({ email, first_name: firstName || null })
          .select('id')
          .single()
        customerId = newC?.id
      }

      // Save order
      await supabase.from('orders').insert({
        customer_id:       customerId || null,
        stripe_payment_id: pi.id,
        status:            'paid',
        total:             pi.amount / 100,
        items:             cart,
        shipping_address:  pi.metadata.shipping_address
          ? { address: pi.metadata.shipping_address } : null
      }).then(({ error }) => {
        if (error && error.code !== '23505') {
          console.error('[Webhook] Order save error:', error.message)
        }
      })

      // Decrement stock for physical products
      for (const item of cart) {
        if (!item.is_digital) {
          await supabase.rpc('decrement_stock', {
            p_product_id: item.id,
            p_qty: item.qty
          }).catch(e => console.error('[Webhook] Stock error:', e.message))
        }
      }
    }

    console.log('[Webhook] Payment succeeded:', pi.id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ status: 'failed' })
      .eq('stripe_payment_id', pi.id)
    console.warn('[Webhook] Payment failed:', pi.id)
  }

  res.json({ received: true })
})

module.exports = router
