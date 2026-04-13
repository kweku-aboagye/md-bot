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
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-dashboard-pin');
    next();
  });
}

// PIN protection for manual trigger routes.
// Set DASHBOARD_PIN=<your-pin> in .env to enable.
// If not set, the routes are unprotected (local-only dev is fine without it).
app.use('/api/test', (req, res, next) => {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin) return next(); // no PIN configured — allow through
  if (req.method === 'OPTIONS') return next(); // CORS preflight
  const provided = req.headers['x-dashboard-pin'];
  if (!provided || provided !== pin) {
    return res.status(401).json({ message: 'Invalid PIN' });
  }
  next();
});

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

(async () => {
  try {
    await ensureInternalTables();
  } catch (err: any) {
    log(`Failed to ensure internal tables: ${err.message || String(err)}`);
  }

  await registerRoutes(httpServer, app);
  await startScheduler();

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
