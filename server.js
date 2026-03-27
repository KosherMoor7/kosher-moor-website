require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')
const app     = express()

// CORS
app.use(cors({ origin: '*', credentials: true }))

// Webhook must come before json parser
app.use('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    res.json({ received: true })
  }
)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Stripe route
const stripeRoute = require('./src/routes/stripe')
app.use('/api/stripe', stripeRoute)
app.use('/api', stripeRoute)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'The Kosher Moor',
    timestamp: new Date().toISOString()
  })
})

// Serve frontend
app.use(express.static(path.join(__dirname, '.')))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found.' })
  }
  res.sendFile(path.join(__dirname, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('👑 Kosher Moor running on port ' + PORT)
})
module.exports = app
