import type { Express } from 'express';
import { log } from '../../core/logging/log';
import { checkLegacyAdminPin } from '../../core/http/auth';
import { getPwStatus, listPwSundays, runValidation } from './service';

export function registerPwRoutes(app: Express) {
  app.get('/api/pw/status', async (_req, res) => {
    try {
      res.json(await getPwStatus());
    } catch (err: any) {
      log(`P&W status error: ${err.message}`, 'pw.routes');
      res.status(500).json({ message: err.message || 'Failed to load P&W status' });
    }
  });

  app.get('/api/sundays', async (_req, res) => {
    try {
      res.json(await listPwSundays());
    } catch (err: any) {
      log(`Sundays list error: ${err.message}`, 'pw.routes');
      res.status(500).json({ message: err.message || 'Failed to list Sundays' });
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

  app.post('/api/pw/validate', async (req, res) => {
    if (!checkLegacyAdminPin(req, res)) return;

    try {
      res.json(await runValidation('manual'));
    } catch (err: any) {
      log(`P&W validation error: ${err.message}`, 'pw.routes');
      res.status(500).json({ message: err.message || 'Validation failed' });
    }
  });
}
