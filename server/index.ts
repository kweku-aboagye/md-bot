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
      <section><h2>2. SMS Messaging</h2><p>By providing your phone number to the system administrator, you consent to receive automated SMS reminders related to music ministry scheduling (e.g., setlist deadlines, song selections, rehearsal prep). Message frequency varies based on the ministry schedule — typically 2–10 messages per week. Message and data rates may apply.</p></section>
      <section><h2>3. Opt-Out</h2><p>To stop receiving SMS messages, contact the system administrator directly and request removal. Your number will be removed from the system promptly.</p></section>
      <section><h2>4. Eligibility</h2><p>This service is restricted to active members of the ICGC Praise Temple music ministry. Phone numbers are added manually by the administrator — this is not a public service.</p></section>
      <section><h2>5. Changes</h2><p>These terms may be updated at any time. Continued receipt of messages constitutes acceptance of any changes.</p></section>
      <p class="footer">Last updated: April 2026</p>
    `));
  });

  app.get('/privacy', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(legalPage('Privacy Policy', `
      <h1>Privacy Policy</h1>
      <p class="meta">MD Bot — ICGC Praise Temple Music Director Dashboard</p>
      <section><h2>1. Information We Collect</h2><p>MD Bot collects name, email address, and phone number from ministry team members who have consented to receive automated reminders. This information is provided directly to the system administrator — there are no public sign-up forms.</p></section>
      <section><h2>2. How We Use Your Information</h2><p>Your contact information is used solely to send automated ministry scheduling reminders via email and SMS. We do not use it for marketing, advertising, or any purpose unrelated to the music ministry.</p></section>
      <section><h2>3. Data Storage</h2><p>Contact information is stored in a private, encrypted PostgreSQL database hosted on Railway. It is never stored in source code, version control, or any publicly accessible location.</p></section>
      <section><h2>4. Data Sharing</h2><p>We do not sell, share, or disclose your phone number or email address to any third party. SMS messages are delivered via Twilio solely as a transmission provider; your number is not used by Twilio for any other purpose.</p></section>
      <section><h2>5. Data Retention &amp; Removal</h2><p>Your contact information is retained for as long as you are an active member of the music ministry team. To have your information removed, contact the system administrator and it will be deleted promptly.</p></section>
      <section><h2>6. Contact</h2><p>For any questions or removal requests, contact the ICGC Praise Temple music ministry administrator.</p></section>
      <p class="footer">Last updated: April 2026</p>
    `));
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
