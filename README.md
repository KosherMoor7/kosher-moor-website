# The Kosher Moor — Sovereign Marketplace

A production-ready sovereign e-commerce website offering premium herbal teas, tinctures, supplements, merch, lawn care, mobile auto service, and transformative consulting.

## 🌐 Live Site
[thekoshermoor.com](https://thekoshermoor.com)

---

## 📁 Project Structure

```
kosher-moor-website/
├── index.html              ← Main website entry point
├── css/
│   └── style.css           ← Extracted stylesheet
├── js/
│   └── main.js             ← Extracted JavaScript
├── server.js               ← Express backend (payments, forms)
├── package.json            ← Node.js project config
├── .env.example            ← Environment variables template
├── .gitignore              ← Excluded files
├── .nojekyll               ← Disables Jekyll on GitHub Pages
├── 404.html                ← SPA redirect for GitHub Pages
├── sitemap.xml             ← Search engine sitemap
├── robots.txt              ← Crawler rules
├── _headers                ← Security headers (Netlify)
├── CNAME                   ← Custom domain config
├── og-image.svg            ← Social media preview image
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto-deploy to GitHub Pages
```

---

## 🚀 Deployment (GitHub Pages — Static)

This site deploys automatically on every push to `main`.

1. **Enable GitHub Pages**
   - Go to **Settings → Pages**
   - Set **Source** to `GitHub Actions`
   - Click **Save**

2. **Custom domain** (optional)
   - Update `CNAME` with your domain
   - Add the required DNS records at your registrar
   - Enable **Enforce HTTPS** in Settings → Pages

3. **Push changes**
   ```bash
   git add .
   git commit -m "Update site"
   git push
   ```
   GitHub Actions will deploy automatically within ~60 seconds.

> ℹ️ For static GitHub Pages hosting you do **not** need the Node.js backend.
> Use [Stripe Payment Links](https://stripe.com/payment-links) for payments.

---

## 🖥️ Full-Stack Backend (Optional)

For server-side Stripe processing, form handling, and webhook support:

### Prerequisites
- Node.js ≥ 18
- A Stripe account ([stripe.com](https://stripe.com))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Open .env and fill in your Stripe keys and other values

# 3. Start the server
npm start
# Development (auto-restarts on file change):
npm run dev
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Server health check |
| `POST` | `/create-checkout-session` | Create Stripe Checkout session |
| `POST` | `/webhook` | Stripe webhook handler |
| `POST` | `/contact` | Contact / booking form submission |

---

## 💳 Stripe Integration

### Static (no backend)
1. Sign up at [stripe.com](https://stripe.com)
2. Create a [Payment Link](https://stripe.com/payment-links) for each product
3. Replace the placeholder URLs in `js/main.js` → `STRIPE_CONFIG`

### Full backend
1. Copy `.env.example` → `.env`
2. Add your `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
3. Update `STRIPE_CONFIG.publishableKey` in `js/main.js`
4. Deploy `server.js` (Render, Railway, Heroku, VPS, etc.)
5. Set `STRIPE_CONFIG.checkoutEndpoint` to your server URL + `/create-checkout-session`
6. Configure a webhook at [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) pointing to `/webhook`

---

## 🔐 Admin Dashboard

Access the built-in admin dashboard from any page:

- **Keyboard shortcut:** `Ctrl + Shift + Alt + A`
- **Default username:** `km_owner`
- **Password:** SHA-256 hash stored in `ADMIN_CREDS.passHash` inside `js/main.js`

> ⚠️ **Change the default password before going live.**
> Generate a new hash at [sha256.online](https://sha256.online) and update `passHash`.

---

## ✅ Pre-Launch Checklist

- [ ] Change admin password (`ADMIN_CREDS.passHash` in `js/main.js`)
- [ ] Save your 2FA backup code somewhere safe
- [ ] Upload `og-image.jpg` (1200×630px) and update the OG image URL in `index.html`
- [ ] Set your real Stripe publishable key in `js/main.js` → `STRIPE_CONFIG.publishableKey`
- [ ] Verify Cash App, Venmo, and Zelle handles in `js/main.js`
- [ ] Update the `AI_SYSTEM_PROMPT` with your physical address
- [ ] Submit `sitemap.xml` to [Google Search Console](https://search.google.com/search-console)
- [ ] Verify `CNAME` contains your correct domain

---

## 📞 Contact

**Phone:** 469-928-9975
**Email:** info@thekoshermoor.com

---

© 2026 The Kosher Moor. All Rights Reserved.
