import type { Express } from 'express';
import { checkLegacyAdminPin } from '../../core/http/auth';
import { log } from '../../core/logging/log';
import { compileZamarPrepList, runZamarPrep } from './service';

export function registerZamarRoutes(app: Express) {
  app.get('/api/zamar/status', async (_req, res) => {
    try {
      res.json(await compileZamarPrepList());
    } catch (err: any) {
      log(`Zamar status error: ${err.message}`, 'zamar.routes');
      res.status(500).json({ message: err.message || 'Zamar status failed' });
    }
  });

  app.post('/api/test/zamar-prep', async (_req, res) => {
    try {
      await runZamarPrep('manual');
      res.json({ ok: true, message: 'Zamar reminder sent' });
    } catch (err) {
      log(`Zamar prep test failed: ${String(err)}`, 'zamar.routes');
      res.status(500).json({ ok: false, message: String(err) });
    }
  });

  app.post('/api/zamar/validate', async (req, res) => {
    if (!checkLegacyAdminPin(req, res)) return;

    try {
      res.json(await runZamarPrep('manual'));
    } catch (err: any) {
      log(`Zamar validation error: ${err.message}`, 'zamar.routes');
      res.status(500).json({ message: err.message || 'Zamar validation failed' });
    }
  });
}
