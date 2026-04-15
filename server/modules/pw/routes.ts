import type { Express } from 'express';
import { log } from '../../core/logging/log';
import { getPwStatus, runValidation } from './service';

export function registerPwRoutes(app: Express) {
  app.get('/api/pw/status', async (_req, res) => {
    try {
      res.json(await getPwStatus());
    } catch (err: any) {
      log(`P&W status error: ${err.message}`, 'pw.routes');
      res.status(500).json({ message: err.message || 'Failed to load P&W status' });
    }
  });

  app.post('/api/test/pw-reminder', async (_req, res) => {
    try {
      const result = await runValidation('manual');
      if (result.error) {
        res.status(500).json({ ok: false, message: result.error, result });
        return;
      }

      res.json({ ok: true, message: 'P&W reminder fired', result });
    } catch (err: any) {
      log(`P&W reminder test failed: ${err.message}`, 'pw.routes');
      res.status(500).json({ ok: false, message: err.message || String(err) });
    }
  });
}
