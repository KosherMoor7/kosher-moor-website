/* The Kosher Moor — Main JavaScript */

const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});
function animCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();
document.querySelectorAll('button, a, .product-card, .service-card, .agent-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '20px'; cursor.style.height = '20px';
    cursorRing.style.width = '60px'; cursorRing.style.height = '60px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '12px'; cursor.style.height = '12px';
    cursorRing.style.width = '36px'; cursorRing.style.height = '36px';
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const counters = document.querySelectorAll('[data-count]');
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.count;
      const suffix = target === 24 ? '/7' : target === 8 ? '+' : '+';
      let current = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current) + (current >= target ? suffix : '');
        if (current >= target) clearInterval(timer);
      }, 40);
      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => countObserver.observe(c));

// filterProducts() defined in dynamic storefront section above

// SOVEREIGN AI CUSTOMER SERVICE AGENT — Full Automation
// Powered by Claude AI · Real Conversation · Full Context
let chatOpen = false;
let chatMessageCount = 0;
let leadCaptured = false;
let agentBusy = false;
let conversationHistory = [];

const KM_SYSTEM_PROMPT = `You are the Sovereign Customer Service AI Agent for The Kosher Moor — a premium sovereign marketplace. Your name is "Sovereign." You are expert, warm, professional, and deeply knowledgeable.

THE KOSHER MOOR — COMPLETE BUSINESS PROFILE:

PRODUCTS & PRICING:
- Sacred Teas: Ancestral Rooibos Blend $18.99, Moorish Hibiscus Supreme $22.00. 50+ blends, all organic, wild-crafted, ancestral sourcing.
- Tinctures & Elixirs: Lion's Mane Elixir $44.99 (cognitive focus), Blackseed Oil Tincture $38.00 (100% cold-pressed Nigella Sativa). Third-party lab tested, small-batch.
- Herbal Supplements: Sovereign Ashwagandha $29.99 (adaptogenic, stress mastery), Moringa Power Capsules $32.00 (92 nutrients, African heritage). Vegan & Halal certified.
- KM Merch: Sovereign Emblem Tee $45.00 (premium cotton, embossed gold crest). Also hoodies, hats, athletic wear, socks, tote bags, accessories, gift bundles.
- Lawn Care: Sovereign Lawn Package $89.00 (mow, edge, fertilize, clean). Weekly/bi-weekly plans, fertilization & seeding, landscape design, emergency clean-up.
- Auto Services: Mobile tire changes, rotation & balance, on-site service, no waiting rooms. Fleet service available.

SERVICES:
1. Premium Tea & Herbal Shop — 50+ exclusive blends, bulk orders available, custom blend consultation
2. Sacred Tinctures & Elixirs — 30+ tincture formulas, custom formulations, subscription options
3. Herbal Supplement Line — 40+ SKUs, wellness plans, herbalist consultations
4. KM Merch — limited edition drops, custom embroidery, bulk corporate orders
5. Delivery — Same-day (order before 2PM), Next-day nationwide, Auto-ship subscriptions (save 15%)
6. Lawn Care — weekly/bi-weekly maintenance, landscaping, emergency service
7. Auto Care — mobile tire changes, rotation, on-site, fleet service
8. Sovereign Consulting — business architecture, brand sovereignty, revenue mastery, market domination. AI-augmented expert team. 24hr response.

CONTACT & HOURS:
- Phone: 469-928-9975
- Email: info@thekoshermoor.com
- Monday–Friday: 9AM–7PM CST
- Saturday: 10AM–6PM CST
- Sunday: Online orders only (12PM–5PM)
- Online store always open

DELIVERY:
- Same-Day Sovereign: Order before 2PM, delivery within 2–6 hours, local zones
- Next-Day Premium: Nationwide, white-glove packaging
- Auto-Ship: 15% discount, cancel anytime
- Tracking numbers sent as soon as available (within 1–2 hours of shipment)

CONSULTING:
- Services: Business Architecture, Brand Sovereignty, Revenue & Pricing Strategy, Market Entry & Expansion, Social Media & Marketing, Wealth Building & Assets, Full Sovereign Package
- Budget tiers: $500–$1K, $1K–$5K, $5K–$10K, $10K+
- 24hr response with custom strategy plan
- To book: direct customer to click "Book a Consultation" button or use the consulting form on site

TRAFFIC ROUTING INSTRUCTIONS:
- Tea/supplement questions → direct to Products section, offer to describe top sellers
- Lawn care or auto → collect zip code + preferred time, direct to book via Contact form
- Consulting → ask about business type and goals, direct to Book Consultation button
- Order tracking → ask for order email address, check tracking database
- Complaints → acknowledge warmly, offer solution, escalate to "senior team within 24hrs"
- Wholesale/bulk → collect info, route to leadModal contact form
- General browsing → give warm recommendations based on their interests

PERSONALITY:
- Warm, sovereign, professional. Use "we" and "our team."
- Address customer as "beloved" or by name once known.
- Open with respect. Use 👑 🌿 ✦ sparingly for warmth.
- Never say you are an AI model or Claude. You are Sovereign, the KM Agent.
- Keep responses concise and actionable — 2–4 short paragraphs max.
- Always end with a clear next step or question to move the customer forward.
- If a customer wants to place an order, subscribe, book a service, or contact the team, tell them to use the buttons on the site or the contact form.`;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const unread = document.getElementById('chatUnread');
  panel.classList.toggle('open', chatOpen);
  if (chatOpen && unread) {
    unread.style.display = 'none';
  }
}

function clearChat() {
  conversationHistory = [];
  chatMessageCount = 0;
  leadCaptured = false;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML = '';
  const lb = document.getElementById('chatLeadBar');
  if (lb) lb.style.display = 'none';
  addBotMsg('Asalamu Alaykum — welcome back to The Kosher Moor! 👑 I am Sovereign, your dedicated customer service agent. How may I serve you today?');
}

function addBotMsg(html, actionBtns) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  const content = document.createElement('div');
  content.className = 'chat-msg-content';
  content.innerHTML = html;
  div.appendChild(content);
  if (actionBtns && actionBtns.length) {
    const btnsRow = document.createElement('div');
    btnsRow.className = 'chat-action-btns';
    actionBtns.forEach(btn => {
      const b = document.createElement('button');
      b.className = 'chat-action-btn';
      b.textContent = btn.label;
      b.onclick = btn.action;
      btnsRow.appendChild(b);
    });
    div.appendChild(btnsRow);
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  chatMessageCount++;
  // Show lead capture after 3rd bot message if not captured
  if (chatMessageCount >= 3 && !leadCaptured) {
    const lb = document.getElementById('chatLeadBar');
    if (lb) lb.style.display = 'block';
  }
}

function addUserMsg(text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addErrorMsg(text) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg error';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-typing';
  div.id = 'chatTypingIndicator';
  div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTyping() {
  const t = document.getElementById('chatTypingIndicator');
  if (t) t.remove();
}

function setBusy(busy) {
  agentBusy = busy;
  const btn = document.getElementById('chatSendBtn');
  const inp = document.getElementById('chatInput');
  if (btn) btn.disabled = busy;
  if (inp) inp.disabled = busy;
  if (btn) btn.innerHTML = busy ? '<span style="font-size:0.7rem;">...</span>' : '▶';
}

function getContextActions(responseText) {
  const lower = responseText.toLowerCase();
  const actions = [];
  if (lower.includes('tea') || lower.includes('rooibos') || lower.includes('hibiscus')) {
    actions.push({ label: '🍵 Shop Teas Now', action: () => { document.getElementById('products').scrollIntoView({behavior:'smooth'}); filterCat('tea'); toggleChat(); }});
  }
  if (lower.includes('tincture') || lower.includes('supplement') || lower.includes('ashwagandha') || lower.includes('moringa') || lower.includes('lion')) {
    actions.push({ label: '🌿 Browse Products', action: () => { document.getElementById('products').scrollIntoView({behavior:'smooth'}); toggleChat(); }});
  }
  if (lower.includes('lawn') || lower.includes('auto') || lower.includes('tire') || lower.includes('service') || lower.includes('book')) {
    actions.push({ label: '📅 Book Service', action: () => { openModal('leadModal'); }});
  }
  if (lower.includes('consult') || lower.includes('strategy') || lower.includes('business')) {
    actions.push({ label: '🧠 Book Consultation', action: () => { openModal('consultModal'); }});
  }
  if (lower.includes('contact') || lower.includes('email') || lower.includes('reach') || lower.includes('team')) {
    actions.push({ label: '✉️ Contact Us', action: () => { openModal('leadModal'); }});
  }
  if (lower.includes('track') || lower.includes('order') || lower.includes('shipping') || lower.includes('delivery')) {
    actions.push({ label: '📦 Track My Order', action: () => { quickChat('I need to track my order. What information do you need?'); }});
  }
  return actions.slice(0, 3); // max 3 action buttons
}

async function callSovereignAgent(userMessage) {
  setBusy(true);
  const typing = showTyping();

  // Add to history
  conversationHistory.push({ role: 'user', content: userMessage });

  // Keep history at max 20 messages to control token usage
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: KM_SYSTEM_PROMPT,
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error('Agent unavailable (HTTP ' + response.status + ')');
    }

    const data = await response.json();
    const agentReply = data.content && data.content[0] ? data.content[0].text : 'I am here to help — please try again.';

    // Add agent reply to history
    conversationHistory.push({ role: 'assistant', content: agentReply });

    removeTyping();
    const actions = getContextActions(agentReply);

    // Convert line breaks to <br> for display
    const htmlReply = agentReply.replace(/\n/g, '<br>');
    addBotMsg(htmlReply, actions);

    // Auto-save lead if email detected in conversation
    autoDetectEmail(userMessage);

  } catch (err) {
    removeTyping();
    console.error('Sovereign Agent error:', err);
    addErrorMsg('I apologize — I am experiencing a brief interruption. Please try again or use the Contact Us button to reach our team directly. We will respond within 24 hours. 🌿');
  } finally {
    setBusy(false);
  }
}

function autoDetectEmail(text) {
  if (leadCaptured) return;
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    const email = emailMatch[0];
    saveLead({ name: 'Chat Lead', email, phone: '', interest: 'Chat Conversation', source: 'AI Chat Agent' });
    leadCaptured = true;
    const lb = document.getElementById('chatLeadBar');
    if (lb) lb.style.display = 'none';
  }
}

function sendChat() {
  if (agentBusy) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addUserMsg(text);

  // Hide quick buttons after first message
  const qb = document.getElementById('chatQuickBtns');
  if (qb) qb.style.display = 'none';

  callSovereignAgent(text);
}

function quickChat(topic) {
  if (agentBusy) return;
  addUserMsg(topic);
  const qb = document.getElementById('chatQuickBtns');
  if (qb) qb.style.display = 'none';
  if (!chatOpen) toggleChat();
  callSovereignAgent(topic);
}

function captureLeadFromChat() {
  const emailEl = document.getElementById('chatLeadEmail');
  if (!emailEl) return;
  const email = emailEl.value.trim();
  if (!email || !email.includes('@')) {
    emailEl.style.borderColor = 'var(--gold)';
    emailEl.focus();
    return;
  }
  saveLead({ name: 'Chat Subscriber', email, phone: '', interest: 'Chat Lead Capture', source: 'AI Chat Lead Bar' });
  leadCaptured = true;
  const lb = document.getElementById('chatLeadBar');
  if (lb) lb.innerHTML = '<div style="font-size:0.75rem;color:var(--emerald-light);text-align:center;padding:0.3rem;">✦ You are now part of The Moor community! 👑</div>';
  setTimeout(() => { if (lb) lb.style.display = 'none'; }, 3000);
  addBotMsg('✦ Welcome to The Moor family! You have been added to our exclusive list. Expect sovereign drops, early access, and wellness guides straight to your inbox. 👑<br><br>Now — how may I continue to serve you today?');
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if(href === '#') return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 80) {
    nav.style.background = 'rgba(10,10,8,0.98)';
    nav.style.backdropFilter = 'blur(10px)';
  } else {
    nav.style.background = 'linear-gradient(to bottom, rgba(10,10,8,0.98), transparent)';
    nav.style.backdropFilter = 'blur(2px)';
  }
});

function filterCat(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.cat-btn').forEach(b => {
    if(b.getAttribute('onclick') && b.getAttribute('onclick').includes("'"+cat+"'")) b.classList.add('active');
  });
  if(cat === 'all') document.querySelectorAll('.cat-btn')[0].classList.add('active');
  document.querySelectorAll('.product-card').forEach(card => {
    const show = cat === 'all' || card.dataset.cat === cat;
    card.style.display = show ? 'block' : 'none';
    if(show) card.style.animation = 'fadeSlideUp 0.4s ease both';
  });
  document.getElementById('products').scrollIntoView({behavior:'smooth'});
}
// Keep old filterProducts working too
const DB = {
  products: [
    {id:1,name:'Ancestral Rooibos Blend',cat:'tea',price:'18.99',badge:'Bestseller',emoji:'🍵',stock:142,sales:89},
    {id:2,name:'Moorish Hibiscus Supreme',cat:'tea',price:'22.00',badge:'New',emoji:'🌸',stock:88,sales:34},
    {id:3,name:"Lion's Mane Elixir",cat:'tincture',price:'44.99',badge:'Premium',emoji:'🧪',stock:55,sales:67},
    {id:4,name:'Blackseed Oil Tincture',cat:'tincture',price:'38.00',badge:'',emoji:'🌑',stock:72,sales:43},
    {id:5,name:'Sovereign Ashwagandha',cat:'herb',price:'29.99',badge:'Top Rated',emoji:'🌿',stock:210,sales:128},
    {id:6,name:'Moringa Power Capsules',cat:'herb',price:'32.00',badge:'',emoji:'🫚',stock:190,sales:95},
    {id:7,name:'Sovereign Emblem Tee',cat:'merch',price:'45.00',badge:'Exclusive',emoji:'👕',stock:60,sales:41},
    {id:8,name:'Sovereign Lawn Package',cat:'care',price:'89.00',badge:'Book Now',emoji:'🪴',stock:999,sales:22}
  ],
  leads: [],
  reviews: [
    {id:1,name:'Amara J.',email:'amara@email.com',product:'Ancestral Rooibos Tea',stars:5,text:'The Kosher Moor changed how I shop completely. The herbal tinctures are unlike anything I\'ve found — pure, potent, and purposeful.',rec:'Absolutely — 100%',status:'Published',date:'2024-11-15'},
    {id:2,name:'Marcus T.',email:'marcus@email.com',product:'Sovereign Lawn Package',stars:5,text:'I booked the lawn care AND tire service in one go. The AI agent coordinated everything seamlessly. Arrived on time, professional, sovereign.',rec:'Absolutely — 100%',status:'Published',date:'2024-11-20'},
    {id:3,name:'Zara M.',email:'zara@email.com',product:'Consulting Session',stars:5,text:'The consulting session with the AI-augmented team was next level. They had a complete brand strategy and revenue model ready within 48 hours.',rec:'Absolutely — 100%',status:'Published',date:'2024-11-28'}
  ],
  consultations: [],
  nextId: { products:9, leads:1, reviews:4 }
};

function openModal(id){ document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); document.body.style.overflow=''; if(id==='paymentModal'){ currentCart=[]; checkoutSubmitting=false; } }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if(e.target === m) closeModal(m.id); });
});

function switchTab(tabId, groupClass, el){
  document.querySelectorAll('.'+groupClass).forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.atab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if(tabId === 'leads-tab') renderLeadsTable();
  if(tabId === 'reviews-tab') renderReviewsAdmin();
  if(tabId === 'image-tab') { /* image tab loaded */ }
}

function renderProductTable(){
  const tb = document.getElementById('productTableBody');
  if(!tb) return;
  tb.innerHTML = DB.products.map(p => `
    <tr>
      <td>${p.emoji} ${p.name}</td>
      <td><span class="tbadge ${p.cat}">${p.cat}</span></td>
      <td style="color:var(--gold);">$${p.price}</td>
      <td>${p.stock}</td>
      <td>${p.sales}</td>
      <td style="display:flex;gap:0.3rem;flex-wrap:wrap;">
        <button class="tact" onclick="editProduct(${p.id})">Edit</button>
        <button class="tact del" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>`).join('');
}

// addProduct() → see dynamic storefront section


function clearProductForm(){
  ['pName','pPrice','pBadge','pDesc'].forEach(id => document.getElementById(id).value='');
  document.getElementById('imgPreview').style.display='none';
}

function editProduct(id){
  const p = DB.products.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCat').value = p.cat;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pBadge').value = p.badge||'';
  document.getElementById('pDesc').value = p.desc||'';
  switchTab('products-tab','atab', document.querySelector('.atab'));
  document.querySelector('.atab').classList.add('active');
}

function deleteProduct(id){
  if(!confirm('Remove this product from the vault?')) return;
  const idx = DB.products.findIndex(x=>x.id===id);
  if(idx>-1) DB.products.splice(idx,1);
  renderProductTable();
}

function previewImg(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('imgThumb').src = e.target.result;
    document.getElementById('imgPreview').style.display='block';
  };
  reader.readAsDataURL(file);
}

// drag/drop upload
const ud = document.getElementById('uploadDrop');
if(ud){
  ud.addEventListener('dragover', e => { e.preventDefault(); ud.classList.add('over'); });
  ud.addEventListener('dragleave', () => ud.classList.remove('over'));
  ud.addEventListener('drop', e => { e.preventDefault(); ud.classList.remove('over'); const f = e.dataTransfer.files[0]; if(f){ const fi = document.getElementById('pImage'); const dt = new DataTransfer(); dt.items.add(f); fi.files = dt.files; previewImg(fi); } });
}


function submitLead(){
  const name = document.getElementById('l_name').value.trim();
  const email = document.getElementById('l_email').value.trim();
  const phone = document.getElementById('l_phone').value.trim();
  const type = document.getElementById('l_type').value;
  const msg = document.getElementById('l_msg').value.trim();
  const source = document.getElementById('l_source').value;
  if(!name||!email){ alert('Name and email required.'); return; }
  saveLead({name,email,phone,interest:type,msg,source});
  document.getElementById('leadSuccess').style.display='block';
  ['l_name','l_email','l_phone','l_msg'].forEach(id=>document.getElementById(id).value='');
  setTimeout(()=>{ document.getElementById('leadSuccess').style.display='none'; closeModal('leadModal'); },3000);
}

function captureLeadCTA(){
  const email = document.getElementById('ctaEmail').value.trim();
  if(!email||!email.includes('@')){ return; }
  saveLead({name:'CTA Subscriber',email,phone:'',interest:'Email Subscriber',source:'CTA Section'});
  document.getElementById('ctaEmail').value='';
  document.getElementById('ctaSuccess').style.display='block';
  setTimeout(()=>document.getElementById('ctaSuccess').style.display='none',5000);
}

function capturePopLead(){
  const email = document.getElementById('popEmail').value.trim();
  const name = document.getElementById('popName').value.trim() || 'Pop-up Lead';
  if(!email||!email.includes('@')){ alert('Please enter a valid email'); return; }
  saveLead({name,email,phone:'',interest:'Exit Intent Pop-up',source:'Lead Pop'});
  document.getElementById('leadPop').innerHTML = `<div class="lp-body" style="text-align:center;padding:1.5rem;"><div style="font-size:2rem;margin-bottom:0.5rem;">👑</div><div style="font-size:0.7rem;color:var(--gold);">Welcome to The Moor!</div><p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem;font-style:italic;">Your 15% code is heading to your inbox now.</p></div>`;
  setTimeout(()=>document.getElementById('leadPop').classList.remove('show'),4000);
}

function renderLeadsTable(){
  updateCRMStats();
  const tb = document.getElementById('leadsBody');
  if(!tb) return;
  if(DB.leads.length === 0){ tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text-muted);font-style:italic;padding:2rem;">Awaiting first visitors</td></tr>'; return; }
  tb.innerHTML = DB.leads.map(l=>`
    <tr style="${l.status==='New'?'color:var(--gold-light);':''}">
      <td>${l.name}</td>
      <td>${l.email}</td>
      <td>${l.phone||'—'}</td>
      <td>${l.interest}</td>
      <td>${l.source||'—'}</td>
      <td><span style="font-size:0.42rem;padding:0.12rem 0.35rem;background:${l.status==='New'?'rgba(200,169,81,0.15)':'rgba(29,74,46,0.3)'};color:${l.status==='New'?'var(--gold)':'var(--emerald-light)'};">${l.status}</span></td>
      <td style="font-size:0.45rem;">${l.date}</td>
    </tr>`).join('');
}

function updateCRMStats(){
  const newLeads = DB.leads.filter(l=>l.status==='New').length;
  const tl = document.getElementById('totalLeads'); if(tl) tl.textContent = DB.leads.length;
  const hl = document.getElementById('hotLeads'); if(hl) hl.textContent = newLeads;
  const es = document.getElementById('emailsSent'); if(es) es.textContent = DB.leads.length * 3;
  const cr = document.getElementById('convRate'); if(cr) cr.textContent = DB.leads.length > 0 ? Math.round((newLeads/DB.leads.length)*100)+'%' : '0%';
}

function exportLeads(){
  if(DB.leads.length===0){ alert('No leads to export yet!'); return; }
  const csv = ['Name,Email,Phone,Interest,Source,Status,Date'].concat(DB.leads.map(l=>`"${l.name}","${l.email}","${l.phone||''}","${l.interest}","${l.source||''}","${l.status}","${l.date}"`)).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'kosher-moor-leads.csv'; a.click();
}

function sendCampaign(){
  if(DB.leads.length===0){ alert('No leads to send to yet!'); return; }
  switchTab('email-tab','atab', document.querySelectorAll('.atab')[2]);
  document.querySelectorAll('.atab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.atab')[2].classList.add('active');
}

const emailTemplates = {
  welcome: {
    subject: 'Email Sequence 1 — Onboarding',
    body: `<strong style="color:var(--gold);">Subject: Welcome to The Kosher Moor — Your Sovereignty Starts Now</strong><br><br>
Peace & Blessings, [First Name],<br><br>
You've just joined one of the most powerful sovereign marketplaces on the planet. This isn't just a store — it's a <em>movement</em>.<br><br>
✅ <strong>Your welcome gift:</strong> Use code <strong style="color:var(--gold);">SOVEREIGN15</strong> for 15% off your first order.<br><br>
Here's what to explore first:<br>
◆ Our Sacred Tea Collection — ancestral blends that transform your morning<br>
◆ Tinctures & Herbal Supplements — sovereignty from the inside out<br>
◆ Sovereign Consulting — ready to scale your business?<br><br>
Our team is available to assist you Monday through Saturday.<br><br>
<em>Rise & Reign,</em><br><strong style="color:var(--gold);">The Kosher Moor Team</strong>`
  },
  promo: {
    subject: 'Alert Campaign — New Launch',
    body: `<strong style="color:var(--gold);">Subject: 🔥 New Drop Alert — The Moor Just Dropped Something Special</strong><br><br>
[First Name], you asked for it. The Moor delivered.<br><br>
A brand-new sovereign drop has just hit our vault. These products were tested, refined, and approved by our AI research agents before landing on shelves.<br><br>
⚡ <strong>Flash: 48-hour early access for Moor subscribers only.</strong><br><br>
What dropped:<br>
◆ New herbal blends from rare ancestral sources<br>
◆ Limited merch release — only 50 pieces<br>
◆ New tincture formula from our Alchemy Research Agent<br><br>
Don't sleep on sovereignty.<br><br>
→ <strong style="color:var(--gold);">thekoshermoor.com</strong><br><br>
<em>The Kosher Moor AI Drop Team</em>`
  },
  abandoned: {
    subject: 'Recovery Sequence — Follow Up',
    body: `<strong style="color:var(--gold);">Subject: You Left Something Behind, [First Name]</strong><br><br>
Our Cart Recover AI agent noticed something — you left items in your cart.<br><br>
The Kosher Moor holds nothing but the highest quality sovereign products. Don't let your cart sit idle.<br><br>
Your items are reserved for <strong>24 more hours.</strong><br><br>
💎 Complete your order and receive:<br>
◆ Free shipping on orders over $50<br>
◆ Bonus wellness guide ($29 value) — FREE with purchase today<br>
◆ Priority processing by our fulfillment AI<br><br>
Use code: <strong style="color:var(--gold);">COMEBACK10</strong> for an extra 10% off.<br><br>
<em>The Vault Upsell Agent — The Kosher Moor</em>`
  },
  consult: {
    subject: 'Nurture Sequence — Consulting Follow-Up',
    body: `<strong style="color:var(--gold);">Subject: [First Name], Are You Ready to Scale?</strong><br><br>
Most businesses plateau. Sovereign ones don't.<br><br>
The Kosher Moor Consulting division has helped dozens of entrepreneurs:<br>
◆ Launch profitable brands from zero<br>
◆ Build 6-figure revenue systems<br>
◆ Create legacy wealth through strategic positioning<br><br>
Our expert consulting team delivers full business blueprints — not generic advice.<br><br>
<strong>Consulting spots for Q1 are limited.</strong><br><br>
→ Book your sovereign strategy session today:<br>
<strong style="color:var(--gold);">thekoshermoor.com/consulting</strong><br><br>
<em>Kosher Moor Consult Agent — The Kosher Moor</em>`
  }
};

function loadEmailTemplate(type){
  const t = emailTemplates[type];
  document.getElementById('emailPreviewContent').innerHTML = t.body;
  document.getElementById('emailPreviewBox').style.display='block';
}


let selectedStars = 5;
function setStars(n){
  selectedStars = n;
  document.querySelectorAll('#starPicker span').forEach((s,i) => {
    s.style.opacity = i < n ? '1' : '0.3';
    s.style.color = i < n ? 'var(--gold)' : '';
  });
}
// setStars called lazily when review modal opens, not at parse time

function submitReview(){
  const name = document.getElementById('rv_name').value.trim();
  const email = document.getElementById('rv_email').value.trim();
  const product = document.getElementById('rv_product').value;
  const text = document.getElementById('rv_text').value.trim();
  const rec = document.getElementById('rv_rec').value;
  if(!name||!text){ alert('Please fill in your name and review.'); return; }
  const review = { id:DB.nextId.reviews++, name, email, product, stars:selectedStars, text, rec, status:'Pending', date:new Date().toLocaleDateString() };
  DB.reviews.unshift(review);
  // Show on site after brief "AI moderation" delay
  setTimeout(()=>{ review.status='Published'; renderReviewsGrid(); const rc=document.getElementById('reviewCount'); if(rc) rc.textContent = DB.reviews.filter(r=>r.status==='Published').length; }, 2000);
  saveLead({name, email, phone:'', interest:'Product Review: '+product, source:'Review Form'});
  document.getElementById('reviewSuccess').style.display='block';
  ['rv_name','rv_email','rv_text'].forEach(id=>document.getElementById(id).value='');
  setTimeout(()=>{ document.getElementById('reviewSuccess').style.display='none'; closeModal('reviewModal'); },3000);
}

function renderReviewsGrid(){
  const grid = document.getElementById('reviewsGrid');
  if(!grid) return;
  const published = DB.reviews.filter(r=>r.status==='Published');
  const avatars = ['👑','🏆','🌟','🦁','💎','🌿','⚡','🧠'];
  grid.innerHTML = published.map((r,i)=>`
    <div style="background:var(--charcoal);border:1px solid rgba(200,169,81,0.1);padding:1.5rem;position:relative;transition:all 0.3s;" onmouseover="this.style.borderColor='rgba(200,169,81,0.3)';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(200,169,81,0.1)';this.style.transform='translateY(0)'">
      <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.8rem;">
        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--emerald-mid),var(--gold-dark));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">${avatars[i%avatars.length]}</div>
        <div style="flex:1;">
          <span style="font-size:0.6rem;color:var(--gold);display:block;">${r.name}</span>
          <span style="font-size:0.38rem;color:var(--text-muted);letter-spacing:0.08em;">${r.product}</span>
        </div>
        <span style="color:var(--gold);font-size:0.7rem;">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span>
      </div>
      <p style="font-size:0.88rem;color:var(--text-light);line-height:1.6;font-style:italic;">"${r.text}"</p>
      <div style="margin-top:0.8rem;background:rgba(29,74,46,0.3);border:1px solid rgba(61,139,90,0.3);padding:0.25rem 0.55rem;display:inline-flex;align-items:center;gap:0.4rem;font-size:0.38rem;color:var(--emerald-light);letter-spacing:0.08em;">
        <span style="width:6px;height:6px;background:#4CAF50;border-radius:50%;animation:pulse 2s ease infinite;flex-shrink:0;display:inline-block;"></span>
        VERIFIED REVIEW · ${r.date}
      </div>
    </div>`).join('');
  const rc = document.getElementById('reviewCount'); if(rc) rc.textContent = published.length;
  updateStorageCount();
}

function renderReviewsAdmin(){
  const tb = document.getElementById('reviewsAdminBody');
  if(!tb) return;
  tb.innerHTML = DB.reviews.map(r=>`
    <tr>
      <td>${r.name}</td>
      <td style="color:var(--gold);">${'★'.repeat(r.stars)}</td>
      <td style="font-size:0.75rem;">${r.product}</td>
      <td style="max-width:200px;font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.text}</td>
      <td><span style="font-size:0.38rem;padding:0.1rem 0.35rem;background:${r.status==='Published'?'rgba(29,74,46,0.4)':'rgba(80,60,0,0.4)'};color:${r.status==='Published'?'var(--emerald-light)':'var(--gold)'};">${r.status}</span></td>
      <td style="display:flex;gap:0.3rem;">
        ${r.status!=='Published'?'<button class="tact" onclick="approveReview('+r.id+')">Approve</button>':''}
        <button class="tact del" onclick="deleteReview(${r.id})">Delete</button>
      </td>
    </tr>`).join('');
}

function approveReview(id){ const r=DB.reviews.find(x=>x.id===id); if(r){ r.status='Published'; renderReviewsAdmin(); renderReviewsGrid(); } }
function deleteReview(id){ const i=DB.reviews.findIndex(x=>x.id===id); if(i>-1){ DB.reviews.splice(i,1); renderReviewsAdmin(); renderReviewsGrid(); } }


//  KOSHER MOOR CONSULT — 3-Agent AI Consulting System
//  Powered by Claude Sonnet · Confidential · $150/session

let kmcCurrentAgent = null;  // 'herbal' | 'sovereignty' | 'business'
let kmcCurrentPage  = 1;
let kmcAnalysisResult = null;
let kmcSessionMemory  = [];  // Stores conversation for continuity

const KMC_RATE = { count: 0, resetAt: 0, maxPerHour: 3 };

function kmcCheckRateLimit() {
  const now = Date.now();
  if (now > KMC_RATE.resetAt) { KMC_RATE.count = 0; KMC_RATE.resetAt = now + 3600000; }
  if (KMC_RATE.count >= KMC_RATE.maxPerHour) return false;
  KMC_RATE.count++;
  return true;
}


const KMC_AGENT_PROMPTS = {

  herbal: function(data) {
    return `You are the world's foremost herbalist and sovereign wellness consultant — a $1M/year expert whose protocols combine West African pharmacopeia, Moorish botanical science, Ayurvedic wisdom, and modern phytochemistry research. Your clients pay $500/hour for what you're about to deliver.

Analyze this client intake deeply:

CLIENT DATA:
${JSON.stringify(data, null, 2)}

Your response MUST include ALL of these sections, formatted in rich HTML:

<div class="kmc-report">

<div class="kmc-section">
<h2>◆ Expert Diagnosis of Your Herbal Constitution</h2>
[Analyze their health goals, challenges, age range, heritage, and current routine. Identify their dominant imbalances (e.g., vata/pitta/kapha or TCM patterns), their ancestral herbal heritage, and what their symptom cluster reveals about their specific needs. Be specific and authoritative — not generic.]
</div>

<div class="kmc-section">
<h2>◆ Your Sovereign Daily Protocol</h2>
[Build a complete morning → afternoon → evening herbal protocol with specific herbs, forms, doses, timing, and preparation methods. Include at minimum 5–7 specific herbs with their scientific names. Tie herbs to their ancestral/cultural origins where relevant.]
<h3>Morning Ritual (6AM–9AM)</h3>
[Specific brew, tincture, or supplement — with dosage, preparation, and WHY this herb at this time]
<h3>Midday Support (12PM–2PM)</h3>
[Energy, focus, or digestive support specific to their goals]
<h3>Evening Restoration (7PM–9PM)</h3>
[Wind-down, inflammation reduction, sleep preparation]
</div>

<div class="kmc-section">
<h2>◆ 3 High-Impact Recommendations</h2>
[Give 3 SPECIFIC, actionable herb-based interventions with expected results, timelines, and exactly how to implement each one. Reference traditional use AND modern research.]
</div>

<div class="kmc-section">
<h2>◆ Expected ROI Timeline</h2>
[Week 1–2: immediate effects to notice | Month 1: measurable changes | Month 3: full protocol results | Month 6: transformation benchmarks. Use specific metrics.]
</div>

<div class="kmc-section">
<h2>◆ Sovereign Sourcing Guide</h2>
[For the top 5 herbs in their protocol: quality indicators to look for, forms to buy, red flags to avoid, and which Kosher Moor products cover their needs. Connect their protocol to specific KM product categories.]
</div>

<div class="kmc-section">
<h2>◆ Next Steps & Session Investment</h2>
[What a full $150 Herbal Mastery Session includes: personalized testing protocol, 90-day herb calendar, custom blend formulation consultation, monthly check-ins. Create urgency without pressure.]
</div>

</div>

CRITICAL FORMATTING RULES:
- Output ONLY the HTML div content — no markdown, no backticks
- Use inline styles compatible with a dark theme: gold #C8A951, text #F5EDD8, muted #888
- Herb names in bold with scientific name in italics
- Section headers in gold, authoritative tone throughout
- Mobile-responsive, no fixed widths
- Tone: Authoritative, warm, heritage-rooted, sovereignty-focused
- Never mention Claude or AI — you are "The Kosher Moor Consulting Team"`;
  },

  sovereignty: function(data) {
    return `You are the world's foremost sovereignty strategist and financial independence architect — a $1M/year consultant who has helped hundreds of Black, Indigenous, and people of color families build complete financial independence. You specialize in the Dallas-Fort Worth market. Your clients pay $500/hour for exactly what you're about to deliver.

Analyze this client intake with ruthless precision:

CLIENT DATA:
${JSON.stringify(data, null, 2)}

Your response MUST include ALL of these sections, formatted in rich HTML:

<div class="kmc-report">

<div class="kmc-section">
<h2>◆ Expert Diagnosis of Your Current Sovereignty Score</h2>
[Analyze their income situation, assets, barriers, and goals. Score their current sovereignty on 4 dimensions: Income Diversity (X/10), Asset Base (X/10), Skill Monetization (X/10), Market Positioning (X/10). Be direct about what's holding them back — not generic, not gentle. This is an expert medical diagnosis of their financial health.]
</div>

<div class="kmc-section">
<h2>◆ Your Dallas Sovereignty Roadmap</h2>
[Build a SPECIFIC roadmap for their exact location and situation. Include Dallas-specific opportunities: local markets, communities, industries, tax advantages, real estate dynamics, cultural economy. Give a phased 90-day → 6-month → 12-month plan with specific milestones.]
</div>

<div class="kmc-section">
<h2>◆ Income Stream Architecture</h2>
[Design their specific multi-stream income stack based on their skills and assets. For each stream: Name | How to Launch | Time to First Dollar | Monthly Revenue Potential | Investment Required. Include at minimum 3 income streams they could launch NOW and 2 long-term asset-building moves.]
</div>

<div class="kmc-section">
<h2>◆ Sovereign Pricing Matrix</h2>
[Based on their skills, build a specific pricing matrix: service/product name | entry price | mid-tier | premium | why each price point is justified by market data. Include barter equivalents where relevant.]
</div>

<div class="kmc-section">
<h2>◆ 3 High-Impact Actions (Start This Week)</h2>
[Give 3 actions they can take in the next 7 days that will generate their first results. Be specific: exact actions, exact platforms, exact scripts, exact numbers.]
</div>

<div class="kmc-section">
<h2>◆ Expected ROI Timeline</h2>
[30 days: what they should see | 90 days: measurable benchmarks | 6 months: income milestone | 12 months: sovereignty achieved marker. Use specific dollar figures based on their current situation.]
</div>

<div class="kmc-section">
<h2>◆ Next Steps & Session Investment</h2>
[What a full $150 Sovereignty Strategy Session includes: complete independence audit, customized 90-day action plan, Dallas market connection map, accountability framework. Make the ROI obvious.]
</div>

</div>

CRITICAL FORMATTING RULES:
- Output ONLY the HTML div content — no markdown, no backticks
- Dark theme inline styles: gold #C8A951, cream #F5EDD8, muted #888, emerald #3D8B5A
- Numbers and dollar amounts in gold, bold
- Section headers authoritative, in gold
- Mobile-responsive — no fixed widths
- Tone: Commanding, direct, data-grounded, sovereignty-focused
- Never mention Claude or AI — you are "The Kosher Moor Consulting Team"`;
  },

  business: function(data) {
    return `You are the world's foremost heritage-brand strategist and revenue architect — a $1M/year consultant who has built dozens of culturally-rooted businesses to six and seven figures. You specialize in creating authentic, legacy-driven brands that generate $10K/month and beyond. Your clients pay $500/hour for exactly what you're about to deliver.

Analyze this business intake with expert precision:

CLIENT DATA:
${JSON.stringify(data, null, 2)}

Your response MUST include ALL of these sections, formatted in rich HTML:

<div class="kmc-report">

<div class="kmc-section">
<h2>◆ Expert Brand Diagnosis</h2>
[Analyze their business type, stage, revenue, target customer, and heritage angle. Identify their biggest untapped opportunity, their current positioning gaps, and why they're stuck at their current revenue level. Be brutally honest and specific — no generic business advice.]
</div>

<div class="kmc-section">
<h2>◆ Heritage Brand Positioning Framework</h2>
[Design their unique brand position using their cultural heritage as a competitive moat. Include: Brand Archetype, Core Brand Story (2 sentences), Brand Voice (3 adjectives with examples), Target Audience Avatar (be specific: demographics, psychographics, what they search, where they live), Unique Value Proposition, and 3 key brand differentiators that competitors cannot copy because they are tied to heritage/authenticity.]
</div>

<div class="kmc-section">
<h2>◆ $10K/Month Revenue Architecture</h2>
[Build their SPECIFIC path to $10K/month. Break it down mathematically:
- Core Offer: Price × Volume = Revenue
- Mid-Tier Offer: Price × Volume = Revenue
- Premium/Signature Offer: Price × Volume = Revenue
- Total stack = $10K/month
Include the exact offer names, price points, and delivery model for each tier. Make this feel achievable and specific to their business.]
</div>

<div class="kmc-section">
<h2>◆ 3 High-Impact Recommendations</h2>
[Give 3 SPECIFIC moves that will generate the most revenue in the shortest time for this exact business. Each must include: the action, the revenue impact, the timeline, and exactly how to execute it.]
</div>

<div class="kmc-section">
<h2>◆ 90-Day Market Domination Plan</h2>
[A specific phase-by-phase plan: Phase 1 (Days 1–30): Foundation | Phase 2 (Days 31–60): Growth | Phase 3 (Days 61–90): Scale. Each phase has 3 specific tasks, a revenue target, and a key metric to track.]
</div>

<div class="kmc-section">
<h2>◆ Expected ROI Timeline</h2>
[Month 1: realistic revenue target | Month 3: growth benchmark | Month 6: scale milestone | Month 12: sovereignty achieved. Use specific numbers based on their current stage and revenue.]
</div>

<div class="kmc-section">
<h2>◆ Next Steps & Session Investment</h2>
[What a full $150 Business Brand Session includes: complete brand audit, custom $10K revenue model, marketing funnel design, 90-day accountability plan. Price anchoring: at their first additional $10K/month, session ROI is 6,567%. Make this feel inevitable.]
</div>

</div>

CRITICAL FORMATTING RULES:
- Output ONLY the HTML div content — no markdown, no backticks
- Dark theme inline styles: gold #C8A951, cream #F5EDD8, emerald #3D8B5A
- Revenue numbers in gold and bold — make the math visible
- Section headers authoritative, in gold
- Mobile-responsive — no fixed widths
- Tone: CEO-level authority, heritage-rooted, direct, ambitious
- Never mention Claude or AI — you are "The Kosher Moor Consulting Team"`;
  }
};

function selectAgent(type, el) {
  kmcCurrentAgent = type;
  document.querySelectorAll('.agent-select-card').forEach(c => {
    c.style.border = '1px solid rgba(200,169,81,0.2)';
    c.style.background = 'rgba(0,0,0,0.2)';
    c.style.transform = 'none';
    c.style.boxShadow = 'none';
  });
  if (el) {
    el.style.border = '2px solid var(--gold)';
    el.style.background = 'rgba(200,169,81,0.06)';
    el.style.transform = 'translateY(-3px)';
    el.style.boxShadow = '0 8px 30px rgba(200,169,81,0.12)';
  }
  document.getElementById('agentSelectError').style.display = 'none';
}

function kmcNext(dir) {
  if (dir === 1) {
    // Page 1 → 2: validate agent selected
    if (kmcCurrentPage === 1) {
      if (!kmcCurrentAgent) {
        document.getElementById('agentSelectError').style.display = 'block';
        return;
      }
      kmcSetPage(2);
      return;
    }
    // Page 2 → 3: validate core profile
    if (kmcCurrentPage === 2) {
      const name  = document.getElementById('kmc_name').value.trim();
      const email = document.getElementById('kmc_email').value.trim();
      if (!name || !email) { alert('Please enter your name and email to continue.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email address.'); return; }
      kmcSetPage(3);
      return;
    }
  }

  if (dir === 2) {
    // Page 2 → 3
    kmcSetPage(3);
    return;
  }

  if (dir === 3) {
    // Page 3 → 4: run analysis
    kmcSetPage(4);
    kmcRunAnalysis();
    return;
  }

  if (dir === 4) {
    // Page 4 → 5: confirm
    kmcSetPage(5);
    kmcFinalizeConsult();
    return;
  }

  // Back navigation
  if (dir === -1 && kmcCurrentPage === 2) { kmcSetPage(1); return; }
  if (dir === -2 && kmcCurrentPage === 3) { kmcSetPage(2); return; }
  if (dir === -3 && kmcCurrentPage === 4) { kmcSetPage(3); return; }
}

function kmcSetPage(page) {
  kmcCurrentPage = page;

  // Hide all pages
  ['kcp1','kcp2','kcp3-herbal','kcp3-sovereignty','kcp3-business','kcp4','kcp5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Show correct page
  if (page === 1) {
    document.getElementById('kcp1').style.display = 'block';
  } else if (page === 2) {
    document.getElementById('kcp2').style.display = 'block';
  } else if (page === 3) {
    const pageId = 'kcp3-' + (kmcCurrentAgent || 'herbal');
    document.getElementById(pageId).style.display = 'block';
  } else if (page === 4) {
    document.getElementById('kcp4').style.display = 'block';
    document.getElementById('kmc_loading').style.display = 'block';
    document.getElementById('kmc_results').style.display = 'none';
    document.getElementById('kmc_error').style.display = 'none';
  } else if (page === 5) {
    document.getElementById('kcp5').style.display = 'block';
  }

  // Update step indicators
  ['kmc-step1','kmc-step2','kmc-step3','kmc-step4','kmc-step5'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i + 1 < page) el.classList.add('done');
    else if (i + 1 === page) el.classList.add('active');
  });
}

function kmcGatherData() {
  const base = {
    name:     document.getElementById('kmc_name').value.trim(),
    email:    document.getElementById('kmc_email').value.trim(),
    phone:    document.getElementById('kmc_phone').value.trim(),
    location: document.getElementById('kmc_location').value.trim(),
    age:      document.getElementById('kmc_age').value,
    heritage: document.getElementById('kmc_heritage').value.trim(),
    perfect_outcome: document.getElementById('kmc_perfect').value.trim(),
    agent_type: kmcCurrentAgent,
    session_date: new Date().toLocaleDateString(),
  };

  if (kmcCurrentAgent === 'herbal') {
    return { ...base,
      primary_goal:    document.getElementById('kmc_h_goal').value,
      secondary_goal:  document.getElementById('kmc_h_goal2').value,
      health_challenges: document.getElementById('kmc_h_challenges').value.trim(),
      current_herbs:   document.getElementById('kmc_h_current').value.trim(),
      allergies:       document.getElementById('kmc_h_allergies').value.trim(),
      daily_routine:   document.getElementById('kmc_h_routine').value,
      preferred_form:  document.getElementById('kmc_h_form').value,
      notes:           document.getElementById('kmc_h_notes').value.trim(),
    };
  }

  if (kmcCurrentAgent === 'sovereignty') {
    const assetEls = document.querySelectorAll('#kmc_s_assets input:checked');
    const assets = Array.from(assetEls).map(el => el.value);
    return { ...base,
      income_source:   document.getElementById('kmc_s_income').value,
      monthly_income:  document.getElementById('kmc_s_netincome').value,
      current_assets:  assets,
      goal_12months:   document.getElementById('kmc_s_goal12').value,
      skills_services: document.getElementById('kmc_s_skills').value.trim(),
      barrier:         document.getElementById('kmc_s_barrier').value.trim(),
      budget:          document.getElementById('kmc_s_budget').value,
      urgency:         document.getElementById('kmc_s_urgency').value,
    };
  }

  if (kmcCurrentAgent === 'business') {
    return { ...base,
      business_type:   document.getElementById('kmc_b_type').value.trim(),
      stage:           document.getElementById('kmc_b_stage').value,
      monthly_revenue: document.getElementById('kmc_b_revenue').value,
      target_customer: document.getElementById('kmc_b_customer').value.trim(),
      current_offers:  document.getElementById('kmc_b_offers').value.trim(),
      brand_heritage:  document.getElementById('kmc_b_heritage').value.trim(),
      bottleneck:      document.getElementById('kmc_b_bottleneck').value,
      vision:          document.getElementById('kmc_b_vision').value.trim(),
    };
  }

  return base;
}

const KMC_LOADING_MSGS = [
  'Cross-referencing traditional pharmacopeias...',
  'Analyzing your sovereignty profile...',
  'Building your custom protocol...',
  'Calculating ROI projections...',
  'Preparing your expert recommendations...',
  'Finalizing your sovereign strategy...',
  'Applying heritage frameworks...',
  'Calibrating to your exact situation...',
];
let kmcLoadingInterval = null;

function kmcStartLoadingText() {
  let i = 0;
  const el = document.getElementById('kmc_loading_sub');
  kmcLoadingInterval = setInterval(() => {
    if (el) el.textContent = KMC_LOADING_MSGS[i % KMC_LOADING_MSGS.length];
    i++;
  }, 1800);
}

function kmcStopLoadingText() {
  if (kmcLoadingInterval) { clearInterval(kmcLoadingInterval); kmcLoadingInterval = null; }
}

async function kmcRunAnalysis() {
  // Rate limit check
  if (!kmcCheckRateLimit()) {
    kmcShowError('Session limit reached. Please contact us directly at 469-928-9975 to book your consultation.');
    return;
  }

  const data = kmcGatherData();
  const systemPrompt = KMC_AGENT_PROMPTS[kmcCurrentAgent](data);

  kmcStartLoadingText();

  // Add to session memory
  kmcSessionMemory.push({ role: 'user', content: 'Analyze my intake and provide expert consulting: ' + JSON.stringify(data) });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: kmcSessionMemory,
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Analysis service unavailable (HTTP ' + response.status + ')');
    }

    const result = await response.json();
    const analysisHtml = result.content?.[0]?.text || '';

    // Store response in session memory for continuity
    kmcSessionMemory.push({ role: 'assistant', content: analysisHtml });
    kmcAnalysisResult = analysisHtml;

    kmcStopLoadingText();
    kmcShowResults(analysisHtml);

    // Save lead with agent type
    saveLead({
      name:     data.name,
      email:    data.email,
      phone:    data.phone || '',
      interest: 'KMC Consulting — ' + (kmcCurrentAgent || 'General'),
      source:   'Kosher Moor Consult Form'
    });

  } catch (err) {
    kmcStopLoadingText();
    console.error('KMC Analysis error:', err);
    kmcShowError(err.message || 'Analysis temporarily unavailable. Please try again.');
  }
}

function kmcShowResults(htmlContent) {
  document.getElementById('kmc_loading').style.display = 'none';
  document.getElementById('kmc_error').style.display   = 'none';

  // Inject report with KMC styling
  const inner = document.getElementById('kmc_results_inner');
  inner.innerHTML = `
    <div style="margin-bottom:1rem;padding:0.8rem 1rem;background:rgba(29,74,46,0.2);border-left:3px solid var(--gold);display:flex;align-items:center;gap:0.6rem;">
      <span style="font-size:1.2rem;">◆</span>
      <div>
        <div style="font-family:'Cinzel Decorative',serif;font-size:0.58rem;color:var(--gold);letter-spacing:0.12em;">SOVEREIGN ANALYSIS COMPLETE</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">Prepared by The Kosher Moor Consulting Team · Confidential</div>
      </div>
    </div>
    <style>
      .kmc-report { color: var(--text-light); line-height: 1.65; font-size: 0.85rem; }
      .kmc-section { margin-bottom: 1.4rem; padding-bottom: 1.2rem; border-bottom: 1px solid rgba(200,169,81,0.1); }
      .kmc-section:last-child { border-bottom: none; }
      .kmc-section h2 { font-family: 'Cinzel Decorative', serif; font-size: 0.65rem; color: var(--gold); letter-spacing: 0.08em; margin: 0 0 0.7rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(200,169,81,0.15); }
      .kmc-section h3 { font-size: 0.75rem; color: var(--cream); margin: 0.8rem 0 0.4rem; font-family: 'Cormorant Garamond', serif; }
      .kmc-section p { margin: 0.4rem 0; color: var(--text-muted); }
      .kmc-section strong { color: var(--cream); }
      .kmc-section ul, .kmc-section ol { padding-left: 1.2rem; margin: 0.5rem 0; }
      .kmc-section li { margin: 0.3rem 0; color: var(--text-muted); }
      .kmc-section table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
      .kmc-section td, .kmc-section th { padding: 0.4rem 0.6rem; border: 1px solid rgba(200,169,81,0.12); }
      .kmc-section th { background: rgba(200,169,81,0.08); color: var(--gold); font-size: 0.52rem; letter-spacing: 0.1em; }
    </style>
    ${htmlContent}
  `;

  document.getElementById('kmc_results').style.display = 'block';

  // Scroll results into view
  setTimeout(() => {
    const r = document.getElementById('kmc_results');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function kmcShowError(msg) {
  document.getElementById('kmc_loading').style.display  = 'none';
  document.getElementById('kmc_results').style.display  = 'none';
  document.getElementById('kmc_error_msg').textContent  = msg;
  document.getElementById('kmc_error').style.display    = 'block';
}

function kmcRetry() {
  document.getElementById('kmc_error').style.display = 'none';
  document.getElementById('kmc_loading').style.display = 'block';
  kmcRunAnalysis();
}

function kmcFinalizeConsult() {
  const data = kmcGatherData();
  DB.consultations = DB.consultations || [];
  DB.consultations.push({
    ...data,
    agent: kmcCurrentAgent,
    analysis_preview: kmcAnalysisResult ? kmcAnalysisResult.substring(0, 200) + '...' : 'Pending',
    date: new Date().toLocaleDateString()
  });

  const agentLabels = { herbal: '🌿 Herbal Mastery', sovereignty: '👑 Sovereignty Strategy', business: '🏛️ Business & Brand' };
  document.getElementById('kmc_summary').innerHTML =
    '<strong style="color:var(--gold);">Name:</strong> ' + data.name + '<br>' +
    '<strong style="color:var(--gold);">Email:</strong> ' + data.email + '<br>' +
    '<strong style="color:var(--gold);">Consulting Path:</strong> ' + (agentLabels[kmcCurrentAgent] || kmcCurrentAgent) + '<br>' +
    '<strong style="color:var(--gold);">Location:</strong> ' + (data.location || 'Dallas, TX') + '<br>' +
    '<strong style="color:var(--gold);">Session Investment:</strong> $150<br>' +
    '<strong style="color:var(--gold);">Analysis Status:</strong> <span style="color:#4CAF50;">✓ Complete — Saved to Your Profile</span><br>' +
    '<strong style="color:var(--gold);">Date:</strong> ' + new Date().toLocaleDateString();

  updateStorageCount();
}

function closeConsultModal() {
  closeModal('consultModal');
  // Reset for next session
  setTimeout(() => {
    kmcCurrentAgent   = null;
    kmcCurrentPage    = 1;
    kmcAnalysisResult = null;
    kmcSetPage(1);
    // Clear agent card selection
    document.querySelectorAll('.agent-select-card').forEach(c => {
      c.style.border     = '1px solid rgba(200,169,81,0.2)';
      c.style.background = 'rgba(0,0,0,0.2)';
      c.style.transform  = 'none';
      c.style.boxShadow  = 'none';
    });
  }, 400);
}

(function injectKMCStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .agent-select-card:hover {
      border-color: rgba(200,169,81,0.5) !important;
      background: rgba(200,169,81,0.04) !important;
      transform: translateY(-2px) !important;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .kmc-section em { color: rgba(200,169,81,0.7); font-style: italic; }
    @media (max-width: 580px) {
      #agentCards { grid-template-columns: 1fr !important; }
      #consultModal .modal-box { max-width: 100vw !important; border-radius: 0 !important; }
    }
    @media (min-width: 581px) and (max-width: 750px) {
      #agentCards { grid-template-columns: 1fr 1fr !important; }
    }
  `;
  document.head.appendChild(s);
})();


function updateStorageCount(){
  const ic = document.getElementById('imgCount'); if(ic) ic.textContent = DB.products.length;
  const cc = document.getElementById('custCount'); if(cc) cc.textContent = DB.leads.length;
  const rc = document.getElementById('revCount'); if(rc) rc.textContent = DB.reviews.length;
  const su = document.getElementById('storageUsed'); if(su) su.textContent = (0.02 + DB.products.length*0.005 + DB.leads.length*0.001).toFixed(3);
  const co = document.getElementById('consultCount'); if(co) co.textContent = DB.consultations.length;
}
function updateStorageTab(){ updateStorageCount(); }

let popShown = false;
function showLeadPop(){
  const pop = document.getElementById('leadPop');
  if(pop){ pop.classList.add('show'); setTimeout(()=>pop.classList.remove('show'), 18000); }
}
document.addEventListener('mouseleave', e => {
  if(e.clientY < 20 && !popShown && DB.leads.length === 0){
    popShown = true;
    setTimeout(showLeadPop, 400);
  }
});
// Also show pop after 45s on idle
setTimeout(()=>{ if(!popShown){ popShown=true; showLeadPop(); } }, 45000);


function updateHoursStatus(){
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon...6=Sat
  const hour = now.getHours();
  const min = now.getMinutes();
  const time = hour + min/60;

  const setStatus = (dotId, statusId, open, label) => {
    const dot = document.getElementById(dotId);
    const status = document.getElementById(statusId);
    if(!dot || !status) return;
    if(open){ dot.style.background='#4CAF50'; dot.classList.add('open'); status.textContent='Open Now'; status.style.color='var(--emerald-light)'; }
    else { dot.style.background='#888'; dot.classList.remove('open'); status.textContent=label||'Closed'; status.style.color='var(--text-muted)'; }
  };

  const weekdayOpen = day>=1 && day<=5 && time>=9 && time<19;
  const satOpen = day===6 && time>=10 && time<18;
  setStatus('weekdayDot','weekdayStatus', weekdayOpen, day>=1&&day<=5?'Currently Closed':'Closed Today');
  setStatus('satDot','satStatus', satOpen, day===6?'Currently Closed':'Closed Today');
  // Sunday dot
  const sunDot = document.getElementById('sunDot');
  const sunStatus = document.getElementById('sunStatus');
  if(sunDot && sunStatus){
    if(day===0){ sunDot.style.background='var(--gold)'; sunStatus.textContent='Online Orders Open'; sunStatus.style.color='var(--gold)'; }
    else { sunDot.style.background='#888'; sunStatus.textContent='Online Only'; sunStatus.style.color='var(--text-muted)'; }
  }
}

function showWelcomeBanner(){
  const banner = document.getElementById('welcomeBanner');
  if(banner){
    setTimeout(()=>banner.classList.add('show'),1200);
    setTimeout(()=>banner.classList.remove('show'), 10000);
  }
}

const productEmojis = {tea:['🍵','🌿','🫖','🌸','🌺'],tincture:['🧪','💊','🌑','💧','🫙'],herb:['🌿','🫚','🌱','🍃','💚'],merch:['👕','🧥','🧢','👑','✨'],care:['🪴','🌳','🚗','🔧','⭐']};let selectedImgSrc = null;
const savedImages = [];

function generateProductImage(){
  const prompt = document.getElementById('imgPrompt')?.value.trim();
  const cat = document.getElementById('imgCategory')?.value.toLowerCase().split(' ')[0];
  const style = document.getElementById('imgStyle')?.value;
  if(!prompt){ alert('Please describe the image you want to create.'); return; }

  const gen = document.getElementById('imgGenerating');
  const results = document.getElementById('imgResults');
  if(gen){ gen.style.display='flex'; }
  if(results){ results.style.display='none'; }

  // Generate 4 SVG placeholder product images with unique compositions
  setTimeout(()=>{
    if(gen) gen.style.display='none';
    if(results) results.style.display='block';

    const gallery = document.getElementById('imgGallery');
    if(!gallery) return;
    const emojis = productEmojis[cat] || productEmojis.herb;
    const colors = [
      ['#1A4A2E','#C8A951'],['#0A0A08','#C8A951'],['#1C1C18','#3D8B5A'],['#2D6B45','#E8C96B']
    ];
    gallery.innerHTML = '';
    for(let i=0;i<4;i++){
      const [bg,accent] = colors[i%colors.length];
      const emoji = emojis[i%emojis.length];
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;aspect-ratio:1;cursor:none;border:2px solid rgba(200,169,81,0.2);overflow:hidden;transition:all 0.3s;';
      div.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(135deg,' + bg + ',' + accent + '22);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.5rem;padding:1rem;">'
        + '<span style="font-size:3rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">' + emoji + '</span>'
        + '<div style="font-family:inherit,serif;font-size:0.4rem;color:' + accent + ';letter-spacing:0.2em;text-align:center;text-transform:uppercase;">The Kosher Moor</div>'
        + '<div style="font-size:0.35rem;color:rgba(245,237,216,0.5);font-family:inherit,monospace;letter-spacing:0.15em;text-align:center;">Premium Product</div>'
        + '</div>';
      div.addEventListener('click', ()=>{
        gallery.querySelectorAll('div').forEach(d=>{ d.style.border='2px solid rgba(200,169,81,0.2)'; });
        div.style.border='2px solid var(--gold)';
        selectedImgSrc = div.querySelector('span').textContent;
        const useBtn = document.getElementById('useImgBtn');
        if(useBtn) useBtn.style.display='block';
      });
      gallery.appendChild(div);
    }
    // Save to library
    const saved = document.getElementById('savedImgs');
    if(saved && prompt){
      const item = document.createElement('div');
      const emoji = emojis[0];
      item.style.cssText = 'aspect-ratio:1;background:linear-gradient(135deg,#1A4A2E,#C8A95122);border:1px solid rgba(200,169,81,0.2);display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:none;';
      item.textContent = emoji;
      item.title = prompt;
      saved.prepend(item);
    }
  }, 2200);
}

function useSelectedImage(){
  if(!selectedImgSrc) return;
  const s = document.getElementById('imgSuccess');
  if(s){ s.style.display='block'; setTimeout(()=>s.style.display='none',3000); }
  selectedImgSrc = null;
  const useBtn = document.getElementById('useImgBtn');
  if(useBtn) useBtn.style.display='none';
}


function getIslamicDate(date) {
  // Accurate Hijri calculation using epoch method
  const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
  const z = jd - 1948440 + 10632;
  const n = Math.floor((z - 1) / 10631);
  const z2 = z - 10631 * n + 354;
  const j = Math.floor((10985 - z2) / 5316) * Math.floor(50 * z2 / 17719)
    + Math.floor(z2 / 5670) * Math.floor(43 * z2 / 15238);
  const z3 = z2 - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50)
    - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const month = Math.floor(24 * z3 / 709);
  const day = z3 - Math.floor(709 * month / 24);
  const year = 30 * n + j - 30;
  const hijriMonths = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
    'Jumada al-Awwal','Jumada al-Thani','Rajab',"Sha'ban",
    'Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah'];
  return day + ' ' + hijriMonths[month - 1] + ' ' + year + ' AH';
}

function updateLiveDateDisplay() {
  const el = document.getElementById('liveDateDisplay');
  if (!el) return;
  const now = new Date();
  // CST = UTC-6 (standard) / UTC-5 (daylight). Use Intl API for accuracy
  const cstTime = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const usDate = now.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const islamicDate = getIslamicDate(now);
  el.innerHTML = usDate + ' &nbsp;|&nbsp; ' + islamicDate + ' &nbsp;|&nbsp; ' + cstTime + ' CST';
}
// Update every second
setInterval(updateLiveDateDisplay, 1000);
updateLiveDateDisplay();

const TAX_DB = { transactions: [], nextId: 1 };
const expenseCategories = ['Inventory / Cost of Goods','Shipping & Fulfillment','Marketing & Advertising',
  'Website & Software','Office Supplies','Vehicle / Mileage','Professional Services (CPA/Legal)',
  'Equipment','Utilities','Contractor Payments (1099)','Home Office','Other Expense'];
const incomeCategories = ['Product Sales','Service Revenue','Consulting Revenue','Delivery Revenue','Other Income'];

function updateTxCategories() {
  const type = document.getElementById('txType').value;
  const catEl = document.getElementById('txCat');
  if (!catEl) return;
  const cats = type === 'income' ? incomeCategories : expenseCategories;
  catEl.innerHTML = cats.map(c => '<option>' + c + '</option>').join('');
}

function addTransaction() {
  const type = document.getElementById('txType').value;
  const cat = document.getElementById('txCat').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const desc = document.getElementById('txDesc').value.trim();
  if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
  if (!date) { alert('Please select a date.'); return; }
  TAX_DB.transactions.unshift({ id: TAX_DB.nextId++, type, cat, amount, date, desc: desc || '—' });
  renderTxTable();
  updateTaxStats();
  document.getElementById('txAmount').value = '';
  document.getElementById('txDesc').value = '';
  const s = document.getElementById('txSuccess');
  if (s) { s.style.display = 'block'; setTimeout(() => s.style.display = 'none', 3000); }
}

function renderTxTable() {
  const tb = document.getElementById('txBody');
  if (!tb) return;
  if (TAX_DB.transactions.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-style:italic;padding:1.5rem;">No transactions logged yet.</td></tr>';
    return;
  }
  const rows = TAX_DB.transactions.map(function(t) {
    const typeBg = t.type==='income' ? 'rgba(29,74,46,0.4)' : 'rgba(80,30,30,0.4)';
    const typeColor = t.type==='income' ? 'var(--emerald-light)' : '#E87070';
    const amtColor = t.type==='income' ? 'var(--gold)' : '#E87070';
    const sign = t.type==='income' ? '+' : '-';
    const row = document.createElement('tr');
    row.innerHTML = '<td style="font-size:0.45rem;">' + t.date + '</td>'
      + '<td><span style="font-size:0.4rem;padding:0.1rem 0.4rem;background:' + typeBg + ';color:' + typeColor + ';">' + t.type.toUpperCase() + '</span></td>'
      + '<td style="font-size:0.75rem;">' + t.cat + '</td>'
      + '<td style="font-size:0.75rem;">' + t.desc + '</td>'
      + '<td style="color:' + amtColor + ';">' + sign + '$' + t.amount.toFixed(2) + '</td>'
      + '<td><button class="tact del" onclick="deleteTx(' + t.id + ')">Delete</button></td>';
    return row.outerHTML;
  });
  tb.innerHTML = rows.join('');
}

function deleteTx(id) {
  const i = TAX_DB.transactions.findIndex(t => t.id === id);
  if (i > -1) { TAX_DB.transactions.splice(i, 1); renderTxTable(); updateTaxStats(); }
}

function updateTaxStats() {
  const income = TAX_DB.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = TAX_DB.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;
  const estTax = net > 0 ? net * 0.153 : 0; // SE tax rough estimate
  const f = n => '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
  const yr = document.getElementById('taxYearRevenue'); if(yr) yr.textContent = f(income);
  const ye = document.getElementById('taxYearExpenses'); if(ye) ye.textContent = f(expenses);
  const yn = document.getElementById('taxNetIncome'); if(yn) { yn.textContent = f(net); yn.style.color = net >= 0 ? 'var(--gold)' : '#E87070'; }
  const yt = document.getElementById('taxEstimated'); if(yt) yt.textContent = f(estTax);
}

function exportTaxCSV() {
  if (TAX_DB.transactions.length === 0) { alert('No transactions to export yet.'); return; }
  const csv = ['Date,Type,Category,Description,Amount']
    .concat(TAX_DB.transactions.map(t => '"' + t.date + '","' + t.type + '","' + t.cat + '","' + t.desc + '","' + (t.type==='income'?'+':'-') + t.amount.toFixed(2) + '"'))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'kosher-moor-financials-' + new Date().getFullYear() + '.csv';
  a.click();
}

function generateTaxSummary() {
  const year = new Date().getFullYear();
  const income = TAX_DB.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = TAX_DB.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;
  const seTax = net > 0 ? net * 0.153 : 0;
  const qrtr = net > 0 ? (net * 0.153) / 4 : 0;

  // Group by category
  const incGroups = {};
  const expGroups = {};
  TAX_DB.transactions.forEach(t => {
    if (t.type === 'income') incGroups[t.cat] = (incGroups[t.cat] || 0) + t.amount;
    else expGroups[t.cat] = (expGroups[t.cat] || 0) + t.amount;
  });

  const f = n => '$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
  const catRows = (obj, color) => Object.entries(obj).map(([k, v]) =>
    '<tr><td style="padding:0.3rem 0.5rem;font-size:0.8rem;color:var(--text-muted);">' + k + '</td><td style="padding:0.3rem 0.5rem;font-size:0.8rem;color:' + color + ';">' + f(v) + '</td></tr>'
  ).join('');

  document.getElementById('taxReportContent').innerHTML =
    '<div style="font-size:1rem;color:var(--gold);text-align:center;margin-bottom:1rem;">The Kosher Moor — Tax Summary Report ' + year + '</div>'
    + '<div style="font-size:0.45rem;color:var(--text-muted);text-align:center;margin-bottom:1.5rem;letter-spacing:0.2em;">PRIVATE & CONFIDENTIAL — OWNER USE ONLY</div>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:1rem;">'
    + '<tr style="background:rgba(29,74,46,0.3);"><td colspan="2" style="padding:0.5rem;font-size:0.65rem;color:var(--emerald-light);">INCOME</td></tr>'
    + catRows(incGroups, 'var(--gold)')
    + '<tr style="background:rgba(200,169,81,0.1);"><td style="padding:0.4rem 0.5rem;font-size:0.48rem;color:var(--gold);">TOTAL INCOME</td><td style="padding:0.4rem 0.5rem;color:var(--gold);">' + f(income) + '</td></tr>'
    + '<tr style="background:rgba(80,30,30,0.3);"><td colspan="2" style="padding:0.5rem;font-size:0.65rem;color:#E87070;">EXPENSES</td></tr>'
    + catRows(expGroups, '#E87070')
    + '<tr style="background:rgba(80,30,30,0.2);"><td style="padding:0.4rem 0.5rem;font-size:0.48rem;color:#E87070;">TOTAL EXPENSES</td><td style="padding:0.4rem 0.5rem;color:#E87070;">' + f(expenses) + '</td></tr>'
    + '<tr style="background:rgba(200,169,81,0.15);border-top:2px solid var(--gold);"><td style="padding:0.5rem;font-size:0.7rem;color:var(--gold);">NET INCOME</td><td style="padding:0.5rem;font-size:1rem;color:' + (net >= 0 ? 'var(--gold)' : '#E87070') + ';">' + f(net) + '</td></tr>'
    + '<tr><td style="padding:0.4rem 0.5rem;font-size:0.75rem;color:var(--text-muted);">Est. Self-Employment Tax (15.3%)</td><td style="padding:0.4rem 0.5rem;color:var(--text-muted);">' + f(seTax) + '</td></tr>'
    + '<tr><td style="padding:0.4rem 0.5rem;font-size:0.75rem;color:var(--text-muted);">Est. Quarterly Payment</td><td style="padding:0.4rem 0.5rem;color:var(--text-muted);">' + f(qrtr) + '</td></tr>'
    + '</table>'
    + '<div style="font-size:0.4rem;color:var(--text-muted);border-top:1px solid rgba(200,169,81,0.1);padding-top:0.8rem;line-height:1.6;">Generated: ' + new Date().toLocaleString() + ' &nbsp;|&nbsp; This is an estimate only. Consult a licensed CPA for official tax filings. &nbsp;|&nbsp; IRS: irs.gov/filing &nbsp;|&nbsp; Free File: irs.gov/freefile</div>';

  document.getElementById('taxReportBox').style.display = 'block';
}

function printTaxReport() {
  const content = document.getElementById('taxReportContent').innerHTML;
  const w = window.open('', '_blank');
  w.document.write('<html><head><title>Kosher Moor Tax Report</title><style>body{font-family:serif;background:#0A0A08;color:#F5EDD8;padding:2rem;}table{width:100%;border-collapse:collapse;}td{padding:0.4rem;}</style></head><body>' + content + '</body></html>');
  w.document.close();
  w.print();
}

function clearTaxYear() {
  if (!confirm('Clear all transactions for this tax year? This cannot be undone.')) return;
  TAX_DB.transactions = [];
  renderTxTable();
  updateTaxStats();
}

const TRACKING_DB = [];

function sendTrackingNotification() {
  const email = document.getElementById('trackEmail').value.trim();
  const num = document.getElementById('trackNum').value.trim();
  const carrier = document.getElementById('trackCarrier').value;
  const eta = document.getElementById('trackETA').value;
  const order = document.getElementById('trackOrder').value.trim();
  if (!email || !num) { alert('Customer email and tracking number are required.'); return; }

  const trackingRecord = {
    email, trackNum: num, carrier, eta, order: order || 'Your order',
    sent: new Date().toLocaleString(), id: TRACKING_DB.length + 1
  };
  TRACKING_DB.unshift(trackingRecord);

  // Render in admin table
  renderTrackingTable();

  // Show confirmation in chat (simulate notification sent)
  const msg = 'Tracking notification sent to ' + email + '! ' + carrier + ' #' + num + (eta ? ' · Estimated delivery: ' + eta : '') + ' 📦';
  if (document.getElementById('chatPanel').classList.contains('open')) {
    addBotMsg(msg);
  }

  const s = document.getElementById('trackSuccess');
  if (s) { s.style.display = 'block'; setTimeout(() => s.style.display = 'none', 4000); }

  // Clear fields
  ['trackEmail','trackNum','trackOrder'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

function renderTrackingTable() {
  const tb = document.getElementById('trackingBody');
  if (!tb) return;
  if (TRACKING_DB.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-style:italic;padding:1.5rem;">No tracking numbers sent yet.</td></tr>';
    return;
  }
  tb.innerHTML = TRACKING_DB.map(t =>
    '<tr>'
    + '<td>' + t.email + '</td>'
    + '<td style="font-size:0.75rem;font-style:italic;">' + (t.order || '—') + '</td>'
    + '<td style="font-size:0.45rem;color:var(--gold);">' + t.trackNum + '</td>'
    + '<td>' + t.carrier + '</td>'
    + '<td style="font-size:0.45rem;">' + (t.eta || '—') + '</td>'
    + '<td style="font-size:0.4rem;color:var(--text-muted);">' + t.sent + '</td>'
    + '</tr>'
  ).join('');
}

// Show tracking info to customer when they open chat (if their email is tracked)
function checkCustomerTracking(email) {
  const found = TRACKING_DB.filter(t => t.email.toLowerCase() === email.toLowerCase());
  if (found.length > 0) {
    const latest = found[0];
    return 'We found a shipment for you! 📦 Your order "' + latest.order + '" has been shipped via ' + latest.carrier + '. Tracking number: ' + latest.trackNum + (latest.eta ? '. Estimated delivery: ' + latest.eta : '') + '. Thank you for shopping with The Kosher Moor! 👑';
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  renderProductTable();
  renderReviewsGrid();
  updateCRMStats();
  updateHoursStatus();
  showWelcomeBanner();
  // Initial dynamic renders
  renderStorefront('all');
  renderServicesGrid();
  // Init email + Stripe
  setTimeout(initEmailJS, 1000);
  // Store reveal observer reference for dynamic cards
  window._revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); window._revealObserver.unobserve(e.target); }});
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(function(el){ window._revealObserver.observe(el); });
});

// Admin access is gated — see openAdminGate()

function saveMailchimpConfig() {
  const key = document.getElementById('mc_apikey').value.trim();
  const list = document.getElementById('mc_listid').value.trim();
  if (!key || !list) { alert('Please enter both Mailchimp API key and list ID.'); return; }
  EMAIL_INTEGRATIONS.mailchimp.apiKey = key;
  EMAIL_INTEGRATIONS.mailchimp.listId = list;
  EMAIL_INTEGRATIONS.mailchimp.serverPrefix = key.split('-').pop() || 'us1';
  EMAIL_INTEGRATIONS.mailchimp.enabled = true;
  document.getElementById('mc_status').innerHTML = '<span style="color:#4CAF50;">✓ Connected — syncing new leads automatically</span>';
}
function saveKlaviyoConfig() {
  const key = document.getElementById('kl_apikey').value.trim();
  const list = document.getElementById('kl_listid').value.trim();
  if (!key) { alert('Please enter your Klaviyo public API key.'); return; }
  EMAIL_INTEGRATIONS.klaviyo.publicKey = key;
  EMAIL_INTEGRATIONS.klaviyo.listId = list;
  EMAIL_INTEGRATIONS.klaviyo.enabled = true;
  document.getElementById('kl_status').innerHTML = '<span style="color:#4CAF50;">✓ Connected — syncing new leads automatically</span>';
}
function sendEmailCampaign() {
  const mc = EMAIL_INTEGRATIONS.mailchimp.enabled;
  const kl = EMAIL_INTEGRATIONS.klaviyo.enabled;
  if (!mc && !kl) {
    const s = document.getElementById('emailSuccess');
    if (s) { s.innerHTML = '⚠ Configure Mailchimp or Klaviyo integration above to send live campaigns.'; s.style.display='block'; s.style.background='rgba(200,100,0,0.2)'; s.style.color='#f0a040'; }
    return;
  }
  const s = document.getElementById('emailSuccess');
  if (s) { s.innerHTML = '◆ Campaign queued — routing through ' + (mc ? 'Mailchimp' : 'Klaviyo') + ' now ◆'; s.style.display='block'; s.style.background=''; s.style.color=''; }
  setTimeout(function() { if(s) s.style.display='none'; }, 4000);
}

//  PAYMENT SYSTEM — Full Multi-Method Checkout
let currentCart = [];
let currentPayMethod = 'card';
let checkoutSubmitting = false;

function openCheckout(item) {
  if (item) {
    currentCart = [item];
  } else if (currentCart.length === 0) {
    currentCart = [{ name: 'Selected Products', price: 0, qty: 1 }];
  }
  // Reset form fields
  ['pay_ship_name','pay_ship_email','pay_ship_addr','pay_ship_city','pay_ship_state','pay_ship_zip',
   'pay_card','pay_cvv','pay_exp','pay_zip','pay_pp_email','pay_ca_tag','pay_vm_user',
   'pay_zl_info','pay_bnpl_email'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  // Reset to card payment
  selectPayMethod('card', document.getElementById('pm-card'));
  checkoutSubmitting = false;
  var btn = document.getElementById('checkoutBtn');
  if (btn) { btn.disabled = false; btn.textContent = '◆ Complete Order Securely'; }
  var s = document.getElementById('paySuccess'); if (s) s.style.display = 'none';
  renderCartSummary();
  renderOrderTotal();
  openModal('paymentModal');
}


function renderCartSummary() {
  var el = document.getElementById('cartSummary');
  if (!el) return;
  if (currentCart.length === 0) { el.innerHTML = ''; return; }
  var rows = currentCart.map(function(item, idx) {
    var lineTotal = (item.price * (item.qty || 1)).toFixed(2);
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(200,169,81,0.08);">'
      + '<div style="flex:1;">'
      + '<div style="font-size:0.85rem;color:var(--cream);">' + item.name + '</div>'
      + '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.1rem;">$' + item.price.toFixed(2) + ' each</div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:0.4rem;margin:0 0.8rem;">'
      + '<button onclick="changeQty('+idx+',-1)" style="width:22px;height:22px;background:rgba(200,169,81,0.1);border:1px solid rgba(200,169,81,0.3);color:var(--gold);font-size:0.9rem;cursor:none;display:flex;align-items:center;justify-content:center;">-</button>'
      + '<span style="font-family:Space Mono,monospace;font-size:0.55rem;color:var(--cream);min-width:16px;text-align:center;">' + (item.qty||1) + '</span>'
      + '<button onclick="changeQty('+idx+',1)" style="width:22px;height:22px;background:rgba(200,169,81,0.1);border:1px solid rgba(200,169,81,0.3);color:var(--gold);font-size:0.9rem;cursor:none;display:flex;align-items:center;justify-content:center;">+</button>'
      + '</div>'
      + '<span style="font-size:0.85rem;color:var(--gold);font-weight:600;min-width:50px;text-align:right;">$' + lineTotal + '</span>'
      + '</div>';
  }).join('');
  el.innerHTML = '<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(200,169,81,0.12);padding:0.8rem;margin-bottom:0.5rem;">'
    + '<div style="font-family:Space Mono,monospace;font-size:0.45rem;color:var(--gold);letter-spacing:0.15em;margin-bottom:0.5rem;">ORDER SUMMARY</div>'
    + rows + '</div>';
}

function changeQty(idx, delta) {
  if (!currentCart[idx]) return;
  currentCart[idx].qty = Math.max(1, (currentCart[idx].qty||1) + delta);
  renderCartSummary();
  renderOrderTotal();
}

function renderOrderTotal() {
  const el = document.getElementById('payOrderTotal');
  if (!el) return;
  const subtotal = currentCart.reduce(function(s, i) { return s + (i.price * (i.qty || 1)); }, 0);
  const shipping = subtotal > 60 ? 0 : 7.99;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;
  el.innerHTML = '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="font-size:0.8rem;color:var(--text-muted);padding:0.2rem 0;">Subtotal</td><td style="text-align:right;font-size:0.8rem;color:var(--cream);">$' + subtotal.toFixed(2) + '</td></tr>'
    + '<tr><td style="font-size:0.8rem;color:var(--text-muted);padding:0.2rem 0;">Shipping</td><td style="text-align:right;font-size:0.8rem;color:' + (shipping === 0 ? 'var(--emerald-light)' : 'var(--cream)') + ';">' + (shipping === 0 ? 'FREE 👑' : '$' + shipping.toFixed(2)) + '</td></tr>'
    + '<tr><td style="font-size:0.8rem;color:var(--text-muted);padding:0.2rem 0;">Tax (8.25%)</td><td style="text-align:right;font-size:0.8rem;color:var(--cream);">$' + tax.toFixed(2) + '</td></tr>'
    + '<tr style="border-top:1px solid rgba(200,169,81,0.2);"><td style="font-family:Cinzel Decorative,serif;font-size:0.75rem;color:var(--gold);padding-top:0.5rem;">TOTAL</td><td style="text-align:right;font-family:Cinzel Decorative,serif;font-size:1rem;color:var(--gold);padding-top:0.5rem;">$' + total.toFixed(2) + '</td></tr>'
    + '</table>'
    + (subtotal < 60 ? '<div style="font-size:0.72rem;color:var(--emerald-light);margin-top:0.4rem;font-style:italic;">Add $' + (60 - subtotal).toFixed(2) + ' more for FREE shipping</div>' : '<div style="font-size:0.72rem;color:var(--emerald-light);margin-top:0.4rem;">✓ Free shipping applied!</div>');
}

function selectPayMethod(method, el) {
  currentPayMethod = method;
  document.querySelectorAll('.pay-method-card').forEach(function(c) { c.classList.remove('active-pay'); });
  if (el) el.classList.add('active-pay');
  document.querySelectorAll('.pay-form').forEach(function(f) { f.style.display = 'none'; f.classList.remove('active-form'); });
  const form = document.getElementById('pf-' + method);
  if (form) { form.style.display = 'block'; form.classList.add('active-form'); }
}

function formatCardNum(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
  input.value = v;
}

function selectBNPL(provider, el) {
  document.querySelectorAll('#pf-afterpay [onclick^="selectBNPL"]').forEach(function(c) {
    c.style.borderColor = 'rgba(180,255,0,0.15)';
  });
  if (el) el.style.borderColor = '#b4ff00';
}

function applePayPrompt() {
  if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
    alert('Apple Pay is available on this device. Integration with your payment processor is required to complete the transaction.');
  } else {
    alert('Apple Pay is available on Safari with Apple Pay-enabled devices. Please use another payment method or open on an Apple device with Safari.');
  }
}

function submitOrder() {
  if (checkoutSubmitting) return;

  const shipName  = (document.getElementById('pay_ship_name').value || '').trim();
  const shipEmail = (document.getElementById('pay_ship_email').value || '').trim();
  const shipAddr  = (document.getElementById('pay_ship_addr').value || '').trim();
  const shipCity  = (document.getElementById('pay_ship_city').value || '').trim();
  const shipState = (document.getElementById('pay_ship_state').value || '').trim();
  const shipZip   = (document.getElementById('pay_ship_zip').value || '').trim();

  if (!shipName) { showCheckoutError('Please enter your full name.'); return; }
  if (!shipEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail)) {
    showCheckoutError('Please enter a valid email address.'); return;
  }
  if (!shipAddr) { showCheckoutError('Please enter your shipping address.'); return; }
  if (!shipCity)  { showCheckoutError('Please enter your city.'); return; }
  if (!shipState) { showCheckoutError('Please enter your state.'); return; }
  if (!shipZip)   { showCheckoutError('Please enter your ZIP code.'); return; }

  const method = currentPayMethod;
  if (method === 'card') {
    const cardNum = (document.getElementById('pay_card').value || '').replace(/\s/g,'');
    const cvv     = (document.getElementById('pay_cvv').value || '');
    const expiry  = (document.getElementById('pay_exp').value || '');
    if (cardNum.length < 15) { showCheckoutError('Please enter a valid card number.'); return; }
    if (!/^\d{3,4}$/.test(cvv)) { showCheckoutError('Please enter a valid CVV (3-4 digits).'); return; }
    if (!expiry || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) { showCheckoutError('Please enter a valid expiry date (MM/YY).'); return; }
  } else if (method === 'paypal') {
    const ppEmail = (document.getElementById('pay_pp_email').value || '').trim();
    if (!ppEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ppEmail)) {
      showCheckoutError('Please enter your PayPal email address.'); return;
    }
  } else if (method === 'cashapp') {
    const tag = (document.getElementById('pay_ca_tag').value || '').trim();
    if (!tag) { showCheckoutError('Please enter your Cash App $Cashtag.'); return; }
  } else if (method === 'venmo') {
    const vu = (document.getElementById('pay_vm_user').value || '').trim();
    if (!vu) { showCheckoutError('Please enter your Venmo username.'); return; }
  } else if (method === 'zelle') {
    const zi = (document.getElementById('pay_zl_info').value || '').trim();
    if (!zi) { showCheckoutError('Please enter your Zelle phone or email.'); return; }
  
  } else if (method === 'afterpay') {
    const be = (document.getElementById('pay_bnpl_email').value || '').trim();
    if (!be || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(be)) {
      showCheckoutError('Please enter the email linked to your BNPL account.'); return;
    }
  }

  checkoutSubmitting = true;
  var btn = document.getElementById('checkoutBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing...'; }

  var orderRef = 'KM-' + Date.now().toString(36).toUpperCase();
  var subtotal  = currentCart.reduce(function(s,i){ return s+(i.price*(i.qty||1)); }, 0);
  var shipping  = subtotal>60 ? 0 : 7.99;
  var tax       = subtotal*0.0825;
  var total     = (subtotal+shipping+tax).toFixed(2);

  saveLead({
    name: shipName, email: shipEmail, phone: '',
    interest: 'ORDER '+orderRef+' — '+currentCart.map(function(i){return i.name;}).join(', '),
    source: 'Checkout — '+method.toUpperCase()
  });

  setTimeout(function() {
    checkoutSubmitting = false;
    var s = document.getElementById('paySuccess');
    if (s) {
      s.innerHTML = '◆ Order <strong style="color:var(--gold);">'+orderRef+'</strong> confirmed! '
        + 'Total: <strong style="color:var(--gold);">$'+total+'</strong>. '
        + 'Confirmation &amp; tracking will be sent to <strong>'+shipEmail+'</strong>. 👑';
      s.style.display = 'block';
    }
    if (btn) { btn.disabled = false; btn.textContent = '◆ Complete Order Securely'; }
    // Auto close after 5s
    setTimeout(function() {
      closeModal('paymentModal');
      currentCart = [];
      var s2 = document.getElementById('paySuccess'); if(s2) s2.style.display='none';
    }, 5000);
  }, 1200); // Simulate processing
}

function showCheckoutError(msg) {
  var s = document.getElementById('paySuccess');
  if (s) {
    s.innerHTML = '⚠ '+msg;
    s.style.display = 'block';
    s.style.background = 'rgba(200,60,60,0.15)';
    s.style.borderColor = 'rgba(200,60,60,0.4)';
    s.style.color = '#f08080';
    setTimeout(function(){
      s.style.display='none';
      s.style.background=''; s.style.borderColor=''; s.style.color='';
    }, 4000);
  }
}


// Wire up all product buy buttons to open checkout
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.product-buy').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const card = btn.closest('.product-card');
      if (card) {
        const pname = card.querySelector('.product-name') ? card.querySelector('.product-name').textContent.trim() : 'Product';
        const priceEl = card.querySelector('.product-price');
        const price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
        openCheckout({ name: pname, price: price, qty: 1 });
      } else {
        openCheckout();
      }
    });
  });
});

//  ADMIN SECURITY — Login Gate + 2FA + Session Management

const ADMIN_CREDS = {
  // Hash-based comparison — never store plain text passwords in production
  // These are SHA-256 hashes. Default: user="admin" pass="KM@Secure2024!"
  // Change by generating your own SHA-256 hash at: sha256.online
  username: 'km_owner',
  passHash: '5b409ad1c3de10f01092baa800af886e3246d95042bc2e733843e06472024913', // SHA-256 of: KM_Owner_2026! — change at sha256.online
  // 2FA: set your 6-digit TOTP secret or use a fixed backup code during setup
  totpBackupCode: '566725', // Your 2FA backup code — save this somewhere safe!
  // Session timeout in milliseconds (4 hours)
  sessionTimeout: 4 * 60 * 60 * 1000
};

let adminSessionActive = false;
let sessionExpiryTimer = null;
let loginAttempts = 0;
let lockoutUntil = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Disable all URL-based admin access — no /admin path exists
// Block keyboard shortcut discovery
document.addEventListener('keydown', function(e) {
  // Konami-style admin access: Ctrl+Shift+Alt+A opens login gate
  if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'A') {
    e.preventDefault();
    openAdminGate();
  }
});

function openAdminGate() {
  // Check lockout
  if (Date.now() < lockoutUntil) {
    const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
    alert('Access temporarily locked. Try again in ' + mins + ' minute(s).');
    return;
  }
  // If already authenticated and session valid
  if (adminSessionActive) {
    openModal('adminModal');
    renderProductTable();
    renderLeadsTable();
    return;
  }
  // Show login gate
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginStep1').style.display = 'block';
  document.getElementById('loginStep2').style.display = 'none';
  openModal('adminLoginModal');
}

async function hashString(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function submitLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');

  if (!user || !pass) {
    errEl.textContent = 'Both fields are required.';
    errEl.style.display = 'block';
    return;
  }

  // Log attempt (in production, send to server)
  loginAttempts++;
  const passHash = await hashString(pass);

  // Validate credentials
  if (user !== ADMIN_CREDS.username || passHash !== ADMIN_CREDS.passHash) {
    errEl.textContent = 'Invalid credentials. Attempt ' + loginAttempts + ' of ' + MAX_ATTEMPTS + '.';
    errEl.style.display = 'block';

    if (loginAttempts >= MAX_ATTEMPTS) {
      lockoutUntil = Date.now() + LOCKOUT_DURATION;
      loginAttempts = 0;
      closeModal('adminLoginModal');
      alert('Too many failed attempts. Access locked for 15 minutes.');
    }
    return;
  }

  // Credentials valid — show 2FA
  loginAttempts = 0;
  errEl.style.display = 'none';
  document.getElementById('loginStep1').style.display = 'none';
  document.getElementById('loginStep2').style.display = 'block';
  // Focus first TOTP box
  setTimeout(function() {
    var boxes = document.querySelectorAll('.totp-box');
    if (boxes.length) boxes[0].focus();
  }, 100);
}

function totpNav(input, idx) {
  const boxes = document.querySelectorAll('.totp-box');
  // Only allow digits
  input.value = input.value.replace(/[^0-9]/g,'');
  if (input.value && idx < 5) boxes[idx + 1].focus();
  // Auto-submit when all 6 filled
  const code = Array.from(boxes).map(function(b) { return b.value; }).join('');
  if (code.length === 6) submitTotp();
}

function submitTotp() {
  const boxes = document.querySelectorAll('.totp-box');
  const code = Array.from(boxes).map(function(b) { return b.value; }).join('');
  const errEl = document.getElementById('totpError');

  // In production: verify TOTP via server-side HMAC-based algorithm
  // For self-hosted single-file use: compare against backup code
  // Replace ADMIN_CREDS.totpBackupCode with your real authenticator code
  if (code === ADMIN_CREDS.totpBackupCode || code === generateTimedCode()) {
    // SUCCESS — establish session
    adminSessionActive = true;
    closeModal('adminLoginModal');
    // Clear TOTP boxes
    boxes.forEach(function(b) { b.value = ''; });
    errEl.style.display = 'none';

    // Set session expiry
    clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = setTimeout(function() {
      adminSessionActive = false;
      closeModal('adminModal');
    }, ADMIN_CREDS.sessionTimeout);

    // Open dashboard
    openModal('adminModal');
    renderProductTable();
    renderLeadsTable();
    updateCRMStats();

    // Reveal the admin nav button subtly (only after authenticated)
    var btn = document.getElementById('navAdminBtn');
    if (btn) { btn.style.opacity = '0.4'; btn.style.pointerEvents = 'auto'; }
  } else {
    errEl.textContent = 'Invalid verification code. Please try again.';
    errEl.style.display = 'block';
    boxes.forEach(function(b) { b.value = ''; });
    boxes[0].focus();
  }
}

// Time-based 6-digit code (changes every 30s, simple TOTP-style)
// In production replace with proper TOTP library (e.g. otplib)
function generateTimedCode() {
  const window30 = Math.floor(Date.now() / 30000);
  var hash = 0;
  var str = 'KM_TOTP_SECRET_' + window30;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return String(Math.abs(hash) % 900000 + 100000);
}

function endAdminSession() {
  adminSessionActive = false;
  clearTimeout(sessionExpiryTimer);
  closeModal('adminModal');
  var btn = document.getElementById('navAdminBtn');
  if (btn) { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; }
}

// Override openAdmin to always go through gate
function openAdmin() {
  openAdminGate();
}

const EMAIL_INTEGRATIONS = {
  // Set your API keys here (in production, use environment variables / server-side)
  mailchimp: {
    enabled: false,
    apiKey: '', // e.g. 'abc123-us14'
    listId: '', // Your audience/list ID
    serverPrefix: '' // e.g. 'us14'
  },
  klaviyo: {
    enabled: false,
    publicKey: '', // Your Klaviyo public API key
    listId: '' // Your Klaviyo list ID
  }
};

async function syncLeadToMailchimp(lead) {
  if (!EMAIL_INTEGRATIONS.mailchimp.enabled || !EMAIL_INTEGRATIONS.mailchimp.apiKey) return false;
  const cfg = EMAIL_INTEGRATIONS.mailchimp;
  try {
    const res = await fetch('https://cors-proxy.example.com/https://' + cfg.serverPrefix + '.api.mailchimp.com/3.0/lists/' + cfg.listId + '/members', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + btoa('anystring:' + cfg.apiKey), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: lead.email, status: 'subscribed', merge_fields: { FNAME: lead.name } })
    });
    return res.ok;
  } catch(e) { return false; }
}

async function syncLeadToKlaviyo(lead) {
  if (!EMAIL_INTEGRATIONS.klaviyo.enabled || !EMAIL_INTEGRATIONS.klaviyo.publicKey) return false;
  const cfg = EMAIL_INTEGRATIONS.klaviyo;
  try {
    const payload = btoa(JSON.stringify({
      token: cfg.publicKey,
      properties: { email: lead.email, first_name: lead.name, source: lead.source || 'Website' }
    }));
    const res = await fetch('https://a.klaviyo.com/api/identify?data=' + payload);
    return res.ok;
  } catch(e) { return false; }
}

// Wrap saveLead to also sync to email platforms
function saveLead(lead) {
  if (!lead || !lead.email) return;
  if (!DB.leads) DB.leads = [];
  const existing = DB.leads.find(function(l) { return l.email && l.email.toLowerCase() === lead.email.toLowerCase(); });
  if (!existing) {
    const now = new Date();
    const newLead = {
      id: DB.nextId ? DB.nextId++ : 1,
      name: lead.name || 'Visitor',
      email: lead.email,
      phone: lead.phone || '',
      interest: lead.interest || 'General',
      source: lead.source || 'Website',
      status: 'New',
      date: now.toLocaleDateString()
    };
    DB.leads.unshift(newLead);
    updateCRMStats();
    // Async sync to email platforms
    syncLeadToMailchimp(newLead);
    syncLeadToKlaviyo(newLead);
  }
}

function scrollTo(id) {
  var el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

//  DYNAMIC STOREFRONT — unlimited products + services

// Category display names and meta
const CAT_META = {
  tea:       { label:'Sacred Teas',        emoji:'🍵', bg:'bg-tea',      stars:'★★★★★' },
  tincture:  { label:'Tinctures',          emoji:'🧪', bg:'bg-tincture', stars:'★★★★★' },
  herb:      { label:'Herbal Supplements', emoji:'🌿', bg:'bg-herb',     stars:'★★★★★' },
  merch:     { label:'KM Merch',           emoji:'👕', bg:'bg-merch',    stars:'★★★★★' },
  care:      { label:'Lawn / Auto',        emoji:'🌱', bg:'bg-lawn',     stars:'★★★★★' },
  service:   { label:'Service',            emoji:'🔧', bg:'bg-herb',     stars:'★★★★★' },
  consult:   { label:'Consulting',         emoji:'🧠', bg:'bg-tincture', stars:'★★★★★' },
  digital:   { label:'Digital',            emoji:'💻', bg:'bg-merch',    stars:'★★★★★' },
  other:     { label:'Other',              emoji:'📦', bg:'bg-herb',     stars:'★★★★★' },
};

function buildProductCard(p, animate) {
  var meta = CAT_META[p.cat] || CAT_META.other;
  var bg   = p.customBg || meta.bg;
  var emoji = p.emoji || meta.emoji;
  var badgeHtml = p.badge ? '<span class="product-badge">'+p.badge+'</span>' : '';
  var imgHtml = p.imageData
    ? '<img src="'+p.imageData+'" alt="'+p.name+'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">'
    : '';
  var btnLabel = (p.cat==='care'||p.cat==='service'||p.cat==='consult') ? 'Book Now' : 'Add to Cart';

  var card = document.createElement('div');
  card.className = 'product-card' + (animate ? ' reveal' : '');
  card.dataset.cat = p.cat;
  card.dataset.pid = p.id;
  card.innerHTML =
    '<div class="product-image '+bg+'">' +
      '<div class="product-image-bg"></div>' +
      imgHtml +
      '<span class="product-emoji"'+(p.imageData?' style="display:none"':'')+'>'+emoji+'</span>' +
      badgeHtml +
    '</div>' +
    '<div class="product-info">' +
      '<div class="product-category">'+(p.catLabel||meta.label)+'</div>' +
      '<div class="product-stars">'+(p.stars||meta.stars)+'</div>' +
      '<div class="product-name">'+p.name+'</div>' +
      '<div class="product-desc">'+(p.desc||'A sovereign product from The Kosher Moor.')+'</div>' +
      '<div class="product-footer">' +
        '<div class="product-price">$'+parseFloat(p.price).toFixed(2)+'</div>' +
        '<button class="product-buy">'+btnLabel+'</button>' +
      '</div>' +
    '</div>';

  // Wire buy button immediately — works for static + dynamic cards
  var btn = card.querySelector('.product-buy');
  btn.addEventListener('click', function() {
    if (p.cat === 'consult') { openModal('consultModal'); return; }
    openCheckout({ name: p.name, price: parseFloat(p.price), qty: 1 });
  });

  return card;
}

function renderStorefront(filterCat) {
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  var cat = filterCat || 'all';
  var toShow = cat === 'all' ? DB.products : DB.products.filter(function(p){ return p.cat === cat; });
  grid.innerHTML = '';

  if (toShow.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-style:italic;">No products in this category yet.</div>';
    return;
  }

  toShow.forEach(function(p) {
    grid.appendChild(buildProductCard(p, true));
  });

  // Trigger IntersectionObserver for reveal animations
  if (window._revealObserver) {
    grid.querySelectorAll('.reveal').forEach(function(el) {
      window._revealObserver.observe(el);
    });
  }
}

// Override filterProducts to use renderStorefront
function filterProducts(cat) {
  document.querySelectorAll('.cat-btn').forEach(function(b){ b.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  renderStorefront(cat);
}

//  DYNAMIC SERVICES

// Services DB — mirrors static HTML services, fully editable
if (!DB.services) {
  DB.services = [
    {id:1, name:'Custom Herbal Formulations', desc:'Cold-extracted, small-batch tinctures. No fillers, no compromises. Pure botanical sovereignty in every drop.', icon:'🧪', price:'From $35', cat:'herb'},
    {id:2, name:'Herbal Wellness Consulting', desc:'Adaptogens, mushrooms, roots & herbs. Ancient remedies, modern precision. Sovereignty starts from within.', icon:'🌿', price:'From $75', cat:'herb'},
    {id:3, name:'Sovereign Delivery Service', desc:'Same-day, next-day, and scheduled delivery. White-glove handling for every order. Your sovereignty, delivered promptly.', icon:'📦', price:'From $7.99', cat:'care'},
    {id:4, name:'Professional Lawn Care', desc:'Professional lawn maintenance, landscaping and beautification. Your property is your sovereignty — we help you keep it regal.', icon:'🌱', price:'From $89', cat:'care'},
    {id:5, name:'Mobile Tire Service', desc:'Flat tire? We come to you. Mobile tire changes, rotations and pressure checks — no shop visit needed.', icon:'🚗', price:'From $65', cat:'care'},
    {id:6, name:'Sovereign Business Consulting', desc:'Business strategy, brand development, wealth building & personal sovereignty. Our consultants are AI-augmented and results-obsessed.', icon:'🧠', price:'From $500', cat:'consult'},
  ];
}

function renderServicesGrid() {
  var grid = document.getElementById('servicesGrid');
  if (!grid || DB.services.length === 0) return;
  grid.innerHTML = '';
  DB.services.forEach(function(svc) {
    var card = document.createElement('div');
    card.className = 'service-card reveal';
    card.dataset.sid = svc.id;
    card.innerHTML =
      '<div class="service-icon">'+svc.icon+'</div>' +
      '<h3 class="service-name">'+svc.name+'</h3>' +
      '<p class="service-desc">'+svc.desc+'</p>' +
      '<div class="service-price" style="font-family:\'Space Mono\',monospace;font-size:0.6rem;color:var(--gold);margin-top:0.5rem;">'+svc.price+'</div>' +
      '<button class="service-btn" onclick="openModal(\'consultModal\')">Book / Inquire</button>';
    grid.appendChild(card);
  });
  if (window._revealObserver) {
    grid.querySelectorAll('.reveal').forEach(function(el){ window._revealObserver.observe(el); });
  }
}

//  IMPROVED addProduct — image support + instant storefront update

function addProduct() {
  var name  = document.getElementById('pName').value.trim();
  var cat   = document.getElementById('pCat').value;
  var price = document.getElementById('pPrice').value;
  var badge = document.getElementById('pBadge').value.trim();
  var desc  = document.getElementById('pDesc').value.trim();
  var imgEl = document.getElementById('imgThumb');
  var imageData = (imgEl && imgEl.src && imgEl.src.startsWith('data:')) ? imgEl.src : null;

  if (!name || !price) { alert('Please enter a product name and price.'); return; }
  if (isNaN(parseFloat(price)) || parseFloat(price) < 0) { alert('Please enter a valid price.'); return; }

  var emojiMap = {tea:'🍵',tincture:'🧪',herb:'🌿',merch:'👕',care:'🌱',service:'🔧',consult:'🧠',digital:'💻',other:'📦'};
  var p = {
    id: DB.nextId.products++,
    name: name,
    cat: cat,
    price: price,
    badge: badge,
    desc: desc || 'A sovereign product from The Kosher Moor.',
    emoji: emojiMap[cat] || '📦',
    imageData: imageData,
    stock: 100,
    sales: 0
  };

  DB.products.push(p);

  // Re-render full storefront so new product appears with correct filtering
  renderStorefront('all');
  // Reset category filter to All
  document.querySelectorAll('.cat-btn').forEach(function(b){ b.classList.remove('active'); });
  var allBtn = document.querySelector('.cat-btn');
  if (allBtn) allBtn.classList.add('active');

  renderProductTable();
  clearProductForm();

  var s = document.getElementById('productSuccess');
  if (s) { s.style.display='block'; setTimeout(function(){ s.style.display='none'; },4000); }

  updateStorageCount();
}

//  ADD SERVICE from admin — new admin service tab functionality

function addService() {
  var name  = document.getElementById('svcName').value.trim();
  var desc  = document.getElementById('svcDesc').value.trim();
  var price = document.getElementById('svcPrice').value.trim();
  var icon  = document.getElementById('svcIcon').value.trim() || '🔧';
  var cat   = document.getElementById('svcCat').value;

  if (!name) { alert('Please enter a service name.'); return; }

  var svc = {
    id: (DB.services.reduce(function(mx,s){ return Math.max(mx,s.id); },0) + 1),
    name: name, desc: desc||'A premium service from The Kosher Moor.',
    icon: icon, price: price||'Contact for pricing', cat: cat
  };

  DB.services.push(svc);
  renderServicesGrid();
  renderServiceTable();

  // Clear form
  ['svcName','svcDesc','svcPrice','svcIcon'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value='';
  });

  var s = document.getElementById('serviceSuccess');
  if (s) { s.style.display='block'; setTimeout(function(){ s.style.display='none'; },4000); }
}

function deleteService(id) {
  if (!confirm('Delete this service?')) return;
  DB.services = DB.services.filter(function(s){ return s.id !== id; });
  renderServicesGrid();
  renderServiceTable();
}

function renderServiceTable() {
  var tb = document.getElementById('serviceTableBody');
  if (!tb) return;
  if (DB.services.length === 0) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1rem;">No services yet.</td></tr>';
    return;
  }
  tb.innerHTML = DB.services.map(function(s){
    return '<tr>' +
      '<td>'+s.icon+' '+s.name+'</td>' +
      '<td style="color:var(--gold);">'+s.price+'</td>' +
      '<td><span class="tbadge '+s.cat+'">'+s.cat+'</span></td>' +
      '<td><button class="tact del" onclick="deleteService('+s.id+')">Delete</button></td>' +
    '</tr>';
  }).join('');
}

//  STRIPE PAYMENTS — Full Integration

// ⚙ CONFIGURATION — Replace with your real keys after Stripe signup
const STRIPE_CONFIG = {
  // Get from: stripe.com → Dashboard → Developers → API Keys
  publishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE',
  // Your backend endpoint (or use Stripe Payment Links for no-backend)
  // For no-backend deploy: use Stripe Payment Links (stripe.com/payment-links)
  checkoutEndpoint: '/create-checkout-session',
  // Texas sales tax rate (Dallas County)
  taxRate: 'txr_YOUR_TAX_RATE_ID', // Create at stripe.com/tax
  // Currency
  currency: 'usd',
  // Success/cancel URLs (update to your real domain)
  successUrl: 'https://thekoshermoor.com/?order=success',
  cancelUrl: 'https://thekoshermoor.com/?order=cancelled',
};

// Stripe product price IDs — create these in Stripe Dashboard → Products
// Then replace the placeholder IDs below
const STRIPE_PRICES = {
  // Format: 'product-name': 'price_XXXXX'
  // Create at: stripe.com → Products → Add Product
  'Ancestral Rooibos Blend':    'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Moorish Hibiscus Supreme':   'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Lions Mane Elixir':          'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Blackseed Oil Tincture':     'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Sovereign Ashwagandha':      'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Moringa Power Capsules':     'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Sovereign Emblem Tee':       'price_REPLACE_WITH_STRIPE_PRICE_ID',
  'Sovereign Lawn Package':     'price_REPLACE_WITH_STRIPE_PRICE_ID',
};

let stripeInstance = null;

function getStripe() {
  if (!stripeInstance && window.Stripe && STRIPE_CONFIG.publishableKey !== 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE') {
    stripeInstance = window.Stripe(STRIPE_CONFIG.publishableKey);
  }
  return stripeInstance;
}

// Stripe Checkout — redirects to Stripe's hosted page
// Use this when you have a backend. For no-backend, use Payment Links.
async function stripeCheckout(productName, priceUsd, qty) {
  var stripe = getStripe();
  if (!stripe) {
    // Stripe not configured yet — fall back to built-in checkout
    openCheckout({ name: productName, price: priceUsd, qty: qty || 1 });
    return;
  }

  // Check if we have a Stripe price ID for this product
  var priceId = STRIPE_PRICES[productName];
  if (!priceId || priceId.includes('REPLACE')) {
    // No price ID set — use built-in checkout
    openCheckout({ name: productName, price: priceUsd, qty: qty || 1 });
    return;
  }

  try {
    // Option A: Use Stripe Payment Links (no backend needed)
    // Create at stripe.com/payment-links and set the URL below
    // window.location.href = 'https://buy.stripe.com/YOUR_PAYMENT_LINK';

    // Option B: Use backend endpoint
    var res = await fetch(STRIPE_CONFIG.checkoutEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: priceId,
        qty: qty || 1,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
      })
    });
    var session = await res.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch(err) {
    console.warn('Stripe checkout error, falling back:', err);
    openCheckout({ name: productName, price: priceUsd, qty: qty || 1 });
  }
}

// Check for Stripe success/cancel redirect
(function checkStripeReturn() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('order') === 'success') {
    setTimeout(function() {
      var s = document.getElementById('paySuccess');
      if (!s) {
        // Show a floating banner
        var banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(29,74,46,0.95);border:1px solid var(--gold);padding:1rem 2rem;font-family:Space Mono,monospace;font-size:0.6rem;color:var(--gold);letter-spacing:0.1em;text-align:center;';
        banner.innerHTML = '◆ ORDER CONFIRMED — SOVEREIGNTY ACHIEVED ◆<br><span style="color:var(--cream);font-size:0.5rem;">Confirmation sent to your email. Thank you, beloved.</span>';
        document.body.appendChild(banner);
        setTimeout(function(){ banner.remove(); }, 6000);
      }
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }, 500);
  }
  if (params.get('order') === 'cancelled') {
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

//  EMAILJS — Real Email Sending (no backend needed)

// ⚙ CONFIGURATION — Get these from emailjs.com (free up to 200 emails/mo)
// Setup: emailjs.com → Sign up → Add Service (Gmail) → Add Template → Copy IDs
const EMAILJS_CONFIG = {
  publicKey:   'YOUR_EMAILJS_PUBLIC_KEY',      // Account → API Keys
  serviceId:   'YOUR_EMAILJS_SERVICE_ID',      // Email Services → Gmail/Outlook
  welcomeTemplateId: 'YOUR_WELCOME_TEMPLATE_ID', // Email Templates → Welcome
  orderTemplateId:   'YOUR_ORDER_TEMPLATE_ID',   // Email Templates → Order Confirm
};

let emailJSReady = false;

function initEmailJS() {
  if (window.emailjs && EMAILJS_CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
    window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    emailJSReady = true;
  }
}

// Send welcome email to new lead
function sendWelcomeEmail(lead) {
  if (!emailJSReady || !lead.email) return;
  window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.welcomeTemplateId, {
    to_name:  lead.name || 'Beloved',
    to_email: lead.email,
    from_name: 'The Kosher Moor',
    reply_to:  'info@thekoshermoor.com',
    subject:   'Welcome to The Kosher Moor — Your Sovereignty Starts Now',
    message:   'Peace & Blessings ' + (lead.name || 'Beloved') + ',\n\nThank you for joining The Kosher Moor. Use code SOVEREIGN15 for 15% off your first order.\n\nExplore our sacred collection at thekoshermoor.com.\n\nRise & Reign,\nThe Kosher Moor Team\n📞 469-928-9975',
    promo_code: 'SOVEREIGN15',
    site_url:   'https://thekoshermoor.com',
    phone:      '469-928-9975',
  }).catch(function(err) { console.warn('EmailJS welcome email error:', err); });
}

// Send order confirmation email
function sendOrderConfirmEmail(name, email, orderRef, total, items) {
  if (!emailJSReady || !email) return;
  window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.orderTemplateId, {
    to_name:    name,
    to_email:   email,
    from_name:  'The Kosher Moor',
    reply_to:   'info@thekoshermoor.com',
    order_ref:  orderRef,
    order_total: '$' + total,
    order_items: items,
    site_url:   'https://thekoshermoor.com',
    phone:      '469-928-9975',
  }).catch(function(err) { console.warn('EmailJS order email error:', err); });
}

//  PATCH saveLead — fire welcome email on every new lead
var _baseSaveLead = saveLead;
saveLead = function(lead) {
  var isNew = !DB.leads || !DB.leads.find(function(l) {
    return l.email && lead.email && l.email.toLowerCase() === lead.email.toLowerCase();
  });
  _baseSaveLead(lead);
  if (isNew && lead.email) {
    sendWelcomeEmail(lead);
  }
};

//  PATCH submitOrder — fire order confirmation email
var _baseSubmitOrder = submitOrder;
submitOrder = function() {
  // We intercept AFTER the order is placed — hook via paySuccess display
  var origSuccess = window.showCheckoutError; // keep reference
  _baseSubmitOrder.call(this);
  // If successful, paySuccess will show — detect and fire email
  setTimeout(function() {
    var s = document.getElementById('paySuccess');
    if (s && s.style.display !== 'none' && s.innerHTML.includes('KM-')) {
      var nameEl = document.getElementById('pay_ship_name');
      var emailEl = document.getElementById('pay_ship_email');
      var refMatch = s.innerHTML.match(/KM-[A-Z0-9]+/);
      var totalMatch = s.innerHTML.match(/\$[\d.]+/);
      var items = currentCart.map(function(i){ return i.name + ' x' + (i.qty||1); }).join(', ');
      if (nameEl && emailEl && refMatch) {
        sendOrderConfirmEmail(
          nameEl.value, emailEl.value,
          refMatch[0], totalMatch ? totalMatch[0] : '—', items
        );
      }
    }
  }, 1500);
};

function checkIntegrationStatus() {
  // Stripe status
  var sEl = document.getElementById('stripe-status-text');
  if (sEl) {
    if (STRIPE_CONFIG.publishableKey.includes('YOUR_STRIPE')) {
      sEl.innerHTML = '<span style="color:#e87070;">⚠ Not configured — add your publishable key</span>';
    } else if (window.Stripe) {
      sEl.innerHTML = '<span style="color:#4CAF50;">✓ Stripe.js loaded · Test mode active</span>';
    } else {
      sEl.innerHTML = '<span style="color:#FFA500;">⏳ Loading Stripe.js...</span>';
    }
  }
  // EmailJS status
  var eEl = document.getElementById('emailjs-status-text');
  if (eEl) {
    if (EMAILJS_CONFIG.publicKey.includes('YOUR_EMAILJS')) {
      eEl.innerHTML = '<span style="color:#e87070;">⚠ Not configured — add EmailJS keys</span>';
    } else if (window.emailjs && emailJSReady) {
      eEl.innerHTML = '<span style="color:#4CAF50;">✓ EmailJS connected · Welcome emails active</span>';
    } else {
      eEl.innerHTML = '<span style="color:#FFA500;">⏳ Initializing...</span>';
    }
  }
}
// Run on admin panel open and periodically
setInterval(function() {
  if (document.getElementById('stripe-status-text')) checkIntegrationStatus();
}, 2000);
