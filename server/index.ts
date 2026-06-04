import 'dotenv/config';
import express, { type Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import { ensureInternalTables } from './core/db';
import { registerRoutes } from './core/http/registerRoutes';
import { log } from './core/logging/log';
import { startScheduler } from './core/scheduling/scheduler';

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets (favicon, icons) from the client public folder in all environments
app.use(express.static(path.join(__dirname, '../../client/public')));

// Allow Vite dev server to call the API during local development
if (process.env.NODE_ENV === 'development') {
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-dashboard-pin');
    next();
  });
}

// PIN protection middleware.
// Set DASHBOARD_PIN=<your-pin> in .env to enable.
// If not set, the routes are unprotected (local-only dev is fine without it).
function checkPin(req: Request, res: Response, next: NextFunction) {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin) return next();
  if (req.method === 'OPTIONS') return next();
  const provided = req.headers['x-dashboard-pin'];
  if (!provided || Array.isArray(provided) || provided !== pin) {
    return res.status(401).json({ message: 'Invalid PIN' });
  }
  next();
}

// Manual trigger routes — PIN required for all methods except GET/OPTIONS
function pinMutationsOnly(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  checkPin(req, res, next);
}

app.use('/api/test', pinMutationsOnly);
// Contacts — PIN required for all methods (GET exposes names/emails)
app.use('/api/contacts', checkPin);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let captured: Record<string, any> | undefined;

  const originalJson = res.json.bind(res);
  res.json = function (body, ...args) {
    captured = body;
    return originalJson(body, ...args);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith('/api') || reqPath === '/health') {
      let line = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      log(line);
    }
  });

  next();
});

function legalPage(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — MD Bot</title><style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e8eaf0;padding:48px 16px;margin:0}div{max-width:680px;margin:0 auto}h1{font-size:24px;font-weight:800;margin:0 0 6px}h2{font-size:16px;font-weight:700;color:#9ca3af;margin:0 0 10px}p{font-size:14px;line-height:1.7;margin:0}section{margin-bottom:28px}.meta{font-size:13px;color:#6b7280;margin-bottom:32px}.footer{font-size:12px;color:#6b7280;margin-top:40px}</style></head><body><div>${body}</div></body></html>`;
}

(async () => {
  try {
    await ensureInternalTables();
  } catch (err: any) {
    log(`Failed to ensure internal tables: ${err.message || String(err)}`);
  }

  await registerRoutes(httpServer, app);
  await startScheduler();

  // Static legal pages — served as real HTML so crawlers and Twilio A2P verifiers
  // can read the content without executing JavaScript.
  app.get('/terms', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(legalPage('Terms of Service', `
      <h1>Terms of Service</h1>
      <p class="meta">MD Bot — ICGC Praise Temple Music Director Dashboard</p>
      <section><h2>1. Purpose</h2><p>MD Bot is an internal automation tool used exclusively by the music ministry team of ICGC Praise Temple. It sends automated scheduling reminders via email and SMS to team members who have explicitly consented to receive them.</p></section>
      <section><h2>2. SMS Messaging Service</h2><p>By opting in to SMS reminders from MD Bot via the web form at <a href="/sms-signup" style="color:#818cf8">md-bot.app/sms-signup</a>, you agree to:</p><ul style="font-size:14px;line-height:1.8;padding-left:20px;margin:8px 0"><li>Receive recurring automated text messages from (346)&nbsp;699-5894 regarding rehearsals and music department scheduling.</li><li>Message frequency: approximately 2–6 messages per month.</li><li>Message and data rates may apply.</li><li>Reply STOP at any time to unsubscribe. You will receive one confirmation message and no further messages will be sent.</li><li>Reply HELP for assistance.</li></ul><p>Phone numbers collected for this service are used solely for SMS delivery and are not shared with third parties. For full details, see our <a href="/privacy" style="color:#818cf8">Privacy Policy</a>.</p></section>
      <section><h2>3. Eligibility</h2><p>This service is for active members of the ICGC Praise Temple music ministry. Opt-in is via the public web form at <a href="/sms-signup" style="color:#818cf8">md-bot.app/sms-signup</a>.</p></section>
      <section><h2>4. Changes</h2><p>These terms may be updated at any time. Continued receipt of messages constitutes acceptance of any changes.</p></section>
      <p class="footer">Last updated: May 2026</p>
    `));
  });

  app.get('/privacy', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(legalPage('Privacy Policy', `
      <h1>Privacy Policy</h1>
      <p class="meta">MD Bot — ICGC Praise Temple Music Director Dashboard</p>
      <section><h2>1. Information We Collect</h2><p>MD Bot collects name, email address, and phone number from ministry team members who have consented to receive automated reminders. Phone numbers are collected via the opt-in form at <a href="/sms-signup" style="color:#818cf8">md-bot.app/sms-signup</a>.</p></section>
      <section><h2>2. SMS Messaging</h2><p>If you opt in to receive SMS text messages from MD Bot, the following applies:</p><ul style="font-size:14px;line-height:1.8;padding-left:20px;margin:8px 0"><li>Message frequency varies, approximately 2–6 messages per month.</li><li>Message and data rates may apply depending on your carrier plan.</li><li>You can opt out at any time by replying STOP to any message.</li><li>For help, reply HELP or contact the music ministry administrator.</li><li>Carriers are not liable for delayed or undelivered messages.</li></ul></section>
      <section><h2>3. How We Use Your Information</h2><p>Your contact information is used solely to send automated ministry scheduling reminders via email and SMS. We do not use it for marketing, advertising, or any purpose unrelated to the music ministry.</p></section>
      <section><h2>4. Data Storage</h2><p>Contact information is stored in a private, encrypted PostgreSQL database hosted on Railway. It is never stored in source code, version control, or any publicly accessible location.</p></section>
      <section><h2>5. Data Sharing</h2><p>We do not sell, share, or disclose your phone number or email address to any third party. SMS messages are delivered via Twilio solely as a transmission provider; your number is not used by Twilio for any other purpose.</p></section>
      <section><h2>6. Data Retention &amp; Removal</h2><p>Your contact information is retained for as long as you are an active member of the music ministry team. To have your information removed, contact the system administrator and it will be deleted promptly.</p></section>
      <section><h2>7. Contact</h2><p>For any questions or removal requests, contact the ICGC Praise Temple music ministry administrator.</p></section>
      <p class="footer">Last updated: May 2026</p>
    `));
  });

  app.get('/sms-signup', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>SMS Sign-Up — MD Bot</title><style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e8eaf0;padding:48px 16px;margin:0}.wrap{max-width:540px;margin:0 auto}h1{font-size:24px;font-weight:800;margin:0 0 8px}.sub{font-size:14px;line-height:1.7;color:#9ca3af;margin:0 0 32px}label.field-label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}input[type=tel]{width:100%;padding:10px 14px;background:#1c1f2a;border:1px solid #374151;border-radius:8px;color:#e8eaf0;font-size:15px;outline:none;-webkit-appearance:none}input[type=tel]:focus{border-color:#6366f1}.consent-row{display:flex;gap:12px;align-items:flex-start;margin:20px 0 24px}input[type=checkbox]{flex-shrink:0;margin-top:3px;width:16px;height:16px;cursor:pointer;accent-color:#6366f1}.consent-text{font-size:13px;color:#9ca3af;line-height:1.7}.consent-text a{color:#818cf8}button{width:100%;padding:12px;background:#6366f1;color:#fff;font-size:15px;font-weight:600;border:none;border-radius:8px;cursor:pointer;-webkit-appearance:none}button:hover{background:#4f46e5}button:disabled{background:#374151;cursor:not-allowed}.msg{margin-top:20px;padding:14px;border-radius:8px;font-size:14px;display:none;line-height:1.6}.success{background:#14532d;color:#86efac}.error-msg{background:#450a0a;color:#fca5a5}.footer{font-size:12px;color:#6b7280;margin-top:40px}</style></head><body><div class="wrap"><h1>Get SMS Reminders from MD Bot</h1><p class="sub">Stay on top of rehearsals, setlists, and scheduling updates from Kweku Aboagye.<br>Enter your number below to receive text reminders from the church music department.</p><form id="form"><label class="field-label" for="phone">Phone Number</label><input type="tel" id="phone" name="phone" placeholder="(555) 000-0000" required autocomplete="tel"><div class="consent-row"><input type="checkbox" id="consent"><label for="consent" class="consent-text">I agree to receive recurring SMS reminders from MD Bot / Kweku Aboagye about rehearsals and music department scheduling at (346) 699-5894. Message frequency varies (approx. 2&ndash;6 messages/month). Message and data rates may apply. Reply STOP to unsubscribe at any time. Reply HELP for help.<br><a href="/privacy">View our Privacy Policy</a> &bull; <a href="/terms">View our Terms</a></label></div><button type="submit" id="btn">Sign Me Up</button></form><div class="msg success" id="success">You&#x2019;re signed up! You&#x2019;ll receive a confirmation text shortly.<br>Reply STOP at any time to unsubscribe.</div><div class="msg error-msg" id="error-msg">Something went wrong. Please try again.</div><p class="footer">MD Bot &mdash; ICGC Praise Temple Music Department</p></div><script>document.getElementById('form').addEventListener('submit',async function(e){e.preventDefault();var btn=document.getElementById('btn');var phone=document.getElementById('phone').value.trim();btn.disabled=true;btn.textContent='Submitting…';document.getElementById('error-msg').style.display='none';try{var r=await fetch('/api/sms-signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:phone})});if(r.ok){document.getElementById('form').style.display='none';document.getElementById('success').style.display='block';}else{var d=await r.json();document.getElementById('error-msg').textContent=d.message||'Something went wrong. Please try again.';document.getElementById('error-msg').style.display='block';btn.disabled=false;btn.textContent='Sign Me Up';}}catch(err){document.getElementById('error-msg').style.display='block';btn.disabled=false;btn.textContent='Sign Me Up';}});</script></body></html>`);
  });

  // In production, serve the built React client and handle SPA routing.
  // Must be registered after all API routes so /api/* routes take precedence.
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get(/^(?!\/(?:api|health)(?:\/|$)).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error('Server error:', err);
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || '5001', 10);
  httpServer.listen({ port, host: '0.0.0.0' }, () => {
    log(`Server running on port ${port}`);
  });
})();
