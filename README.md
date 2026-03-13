# The Kosher Moor — Sovereign Herbal Marketplace

[![Live Site](https://img.shields.io/badge/🌐%20Live%20Site-thekoshermoor.com-green?style=for-the-badge)](https://thekoshermoor.com)

A full-stack sovereign e-commerce marketplace offering premium herbal products, services, merch, and consulting — powered by Express.js and Stripe.

## 🌐 Live Site
[https://thekoshermoor.com](https://thekoshermoor.com)

---

## 📦 Project Structure

```
kosher-moor-website/
├── index.html          ← Full single-page frontend (HTML + CSS + JS)
├── server.js           ← Express backend (Stripe, AI chat proxy, contact form)
├── package.json        ← Node.js dependencies
├── .env.example        ← Environment variable template
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml  ← CI/CD: validate + deploy to GitHub Pages
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- A [Stripe account](https://stripe.com) (free)
- An [Anthropic API key](https://console.anthropic.com) (optional, for AI chat)

### 1 — Clone & install
```bash
git clone https://github.com/KosherMoor7/kosher-moor-website.git
cd kosher-moor-website
npm install
```

### 2 — Set environment variables
```bash
cp .env.example .env
# Open .env and fill in your keys
```

### 3 — Start the server
```bash
npm start
# or for auto-restart on file changes:
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `STRIPE_PUBLIC_KEY` | Yes (frontend) | Stripe publishable key — starts with `pk_test_` or `pk_live_` |
| `STRIPE_SECRET_KEY` | Yes (backend) | Stripe secret key — starts with `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | From Stripe Dashboard → Webhooks |
| `ANTHROPIC_API_KEY` | For AI chat | From console.anthropic.com |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `DOMAIN` | No | Your production domain, e.g. `https://thekoshermoor.com` |

> ⚠️ **Never commit your `.env` file.** It is excluded in `.gitignore`.

---

## 💳 Stripe Setup

### Test Mode (Development)
1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to **Developers → API Keys**
3. Copy your **Test** Publishable Key (`pk_test_...`) and Secret Key (`sk_test_...`)
4. Add them to `.env`

### Configure Products
In `index.html`, find `STRIPE_PRICES` and replace the placeholder IDs:

```js
const STRIPE_PRICES = {
  'Ancestral Rooibos Blend': 'price_XXXXX',  // ← paste your Stripe price ID
  // ...
};
```

Create products at: **Stripe Dashboard → Catalog → Products → Add Product**

### Test Payments
Use these test card numbers:
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Payment succeeds |
| `4000 0000 0000 0002` | ❌ Payment declined |
| `4000 0025 0000 3155` | 🔐 Requires authentication |

Any future expiry date, any 3-digit CVC.

### Webhooks (Local Testing)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhook
# Copy the webhook signing secret (whsec_...) to STRIPE_WEBHOOK_SECRET in .env
```

---

## 🤖 AI Chat (Claude / Sovereign Agent)

The `/api/chat` endpoint proxies requests to Anthropic, keeping your API key server-side.

1. Get an API key at [console.anthropic.com](https://console.anthropic.com)
2. Add it to `.env` as `ANTHROPIC_API_KEY`
3. The frontend chat widget will use `/api/chat` automatically when running through the Express server

> If `ANTHROPIC_API_KEY` is not set the chat widget falls back to the direct browser call (original behaviour).

---

## ☁️ Deployment

### Railway (Recommended — Node.js backend + Stripe)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Select this repository
3. Railway auto-detects Node.js and runs `npm start`
4. Add environment variables in **Settings → Variables**:
   ```
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ANTHROPIC_API_KEY=sk-ant-...
   NODE_ENV=production
   DOMAIN=https://thekoshermoor.com
   ```
5. Set a custom domain: **Settings → Networking → Custom Domain → thekoshermoor.com**
6. Add a Stripe webhook pointing to `https://thekoshermoor.com/api/webhook`

### GitHub Pages (Static — no backend features)

GitHub Actions automatically deploys to GitHub Pages on every push to `main`.

1. Go to **Settings → Pages**
2. Source: **GitHub Actions**
3. Set custom domain: `thekoshermoor.com`
4. Check **Enforce HTTPS**

> ℹ️ On GitHub Pages the Stripe checkout and AI chat require your Stripe keys to be set directly in `index.html` (or use [Stripe Payment Links](https://stripe.com/payment-links) for a no-backend option).

---

## 🔒 Security

- All API keys are loaded from environment variables — never hardcoded
- Stripe webhook signatures are verified server-side
- CORS is restricted to known origins
- Security headers are set on every response (`X-Frame-Options`, `X-Content-Type-Options`, HSTS in production)
- AI chat messages are sanitised before forwarding to Anthropic

---

## 🔑 Admin Panel

Press **Ctrl + Shift + Alt + A** on the live site.

- Default username: `km_owner`
- Default password: `KM_Owner_2026!`

> ⚠️ Change the default password before going live. Generate a new SHA-256 hash at [sha256.online](https://sha256.online), then update `ADMIN_CREDS.passHash` in `index.html`.

---

## ✅ Production Checklist

- [ ] Change admin password hash in `index.html`
- [ ] Replace Stripe test keys with live keys in Railway environment variables
- [ ] Set `STRIPE_WEBHOOK_SECRET` from the Stripe Dashboard
- [ ] Set `ANTHROPIC_API_KEY` if using AI chat
- [ ] Update `STRIPE_PRICES` in `index.html` with real Stripe price IDs
- [ ] Upload `og-image.jpg` (1200×630 px) and update the meta tag URL in `index.html`
- [ ] Verify Cash App / Venmo / Zelle payment handles in `index.html`
- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console)
- [ ] Set custom domain in Railway → set CNAME DNS record pointing to Railway

---

## 📞 Contact

**Phone:** 469-928-9975  
**Email:** info@thekoshermoor.com

---

© 2026 The Kosher Moor. All Rights Reserved.
