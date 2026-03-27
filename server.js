// backend/server.js
require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const path    = require('path')

const app = express()

// ─── Startup Checks ───────────────────────────────────────────────────────────
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ADMIN_EMAIL'
]
const missing = required.filter(key => !process.env[key])
if (missing.length > 0) {
  console.error('⚠️  MISSING ENVIRONMENT VARIABLES:', missing.join(', '))
  if (process.env.NODE_ENV === 'production') process.exit(1)
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Railway serves frontend + backend from the SAME domain.
// Same-origin requests carry no Origin header — must allow null/undefined origin.
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    const allowed = [
      'https://thekoshermoor.com',
      'https://www.thekoshermoor.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ]
    if (allowed.includes(origin) || origin.endsWith('.railway.app')) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true
}))

// ─── Webhook Route — MUST be BEFORE express.json() ───────────────────────────
const webhookRouter = require('./routes/webhooks')
app.use('/api', webhookRouter)

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── API Routes ───────────────────────────────────────────────────────────────
const paymentsRouter = require('./routes/payments')
const adminRouter    = require('./routes/admin')

app.use('/api', paymentsRouter)
app.use('/api/admin', adminRouter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:      'ok',
    service:     'The Kosher Moor API',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    checks: {
      supabase: !!process.env.SUPABASE_URL,
      stripe:   !!process.env.STRIPE_SECRET_KEY,
      admin:    !!process.env.ADMIN_EMAIL
    }
  })
})

// ─── Serve Frontend Static Files ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend')
app.use(express.static(frontendPath))

// Explicit routes so /admin/ and /order-success don't fall through to index.html
app.get('/admin',               (req, res) => res.sendFile(path.join(frontendPath, 'admin', 'index.html')))
app.get('/admin/',              (req, res) => res.sendFile(path.join(frontendPath, 'admin', 'index.html')))
app.get('/admin/dashboard',     (req, res) => res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html')))
app.get('/admin/dashboard.html',(req, res) => res.sendFile(path.join(frontendPath, 'admin', 'dashboard.html')))
app.get('/order-success',       (req, res) => res.sendFile(path.join(frontendPath, 'order-success.html')))

// Catch-all for everything else
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' })
  }
  res.sendFile(path.join(frontendPath, 'index.html'))
})

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\n  👑 THE KOSHER MOOR — Server Running`)
  console.log(`  🌐 http://localhost:${PORT}`)
  console.log(`  🔧 Admin: http://localhost:${PORT}/admin/`)
  console.log(`  💚 Health: http://localhost:${PORT}/api/health`)
  console.log(`  ♻️  Mode: ${process.env.NODE_ENV || 'development'}\n`)
})

module.exports = app
