require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const app = express()

// Startup checks
const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','ADMIN_EMAIL']
const missing  = required.filter(k => !process.env[k])
if (missing.length > 0) {
  console.error('⚠️ MISSING ENV VARS:', missing.join(', '))
  if (process.env.NODE_ENV === 'production') process.exit(1)
}

// CORS
app.use(cors({ origin: (o, cb) => cb(null, true), credentials: true }))

// Webhook MUST come before express.json()
const stripeRouter = require('./src/routes/stripe')
app.use('/api/stripe', stripeRouter)

// Also mount on /api directly so our index.html works
app.post('/api/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.url = '/webhook'
    stripeRouter(req, res, next)
  }
)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Mount payment intent on both paths to be safe
app.post('/api/create-payment-intent', async (req, res, next) => {
  req.url = '/create-payment-intent'
  stripeRouter(req, res, next)
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'The Kosher Moor',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: !!process.env.SUPABASE_URL,
      stripe:   !!process.env.STRIPE_SECRET_KEY,
      admin:    !!process.env.ADMIN_EMAIL
    }
  })
})

// Serve frontend files from root directory
const frontendPath = path.join(__dirname, '.')
app.use(express.static(frontendPath))

// Admin routes
app.get('/admin',    (req, res) => res.sendFile(path.join(frontendPath, 'admin', 'index.html')))
app.get('/admin/',   (req, res) => res.sendFile(path.join(frontendPath, 'admin', 'index.html')))
app.get('/order-success', (req, res) => res.sendFile(path.join(frontendPath, 'order-success.html')))

// Catch-all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found.' })
  }
  res.sendFile(path.join(frontendPath, 'index.html'))
})

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  res.status(500).json({ error: 'Server error.' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\n👑 THE KOSHER MOOR running on port ${PORT}`)
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`)
})

module.exports = app
```
