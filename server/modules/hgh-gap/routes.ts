import type { Express } from 'express';
import { log } from '../../core/logging/log';
import { runHghGapFinder, runHghReport } from './service';

export function registerHghGapRoutes(app: Express) {
  app.get('/api/hgh/status', async (_req, res) => {
    try {
      res.json(await runHghGapFinder());
    } catch (err: any) {
      log(`HGH status error: ${err.message}`, 'hgh-gap.routes');
      res.status(500).json({ message: err.message || 'HGH status failed' });
    }
  });

  app.post('/api/test/hgh-gap-tracker', async (_req, res) => {
    try {
      const result = await runHghReport('manual');
      res.json({ ok: true, message: 'His Glory Heralds gap report sent — check inbox', result });
    } catch (err) {
      log(`HGH gap tracker test failed: ${String(err)}`, 'hgh-gap.routes');
      res.status(500).json({ ok: false, message: String(err) });
    }
  });
}
