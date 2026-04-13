import type { Express } from 'express';
import { log } from '../../core/logging/log';
import { checkHGHSelectionAndNotify, getHghSelectionStatus } from './service';

export function registerHghSelectionRoutes(app: Express) {
  app.get('/api/hgh-selection/status', async (_req, res) => {
    try {
      res.json(await getHghSelectionStatus());
    } catch (err: any) {
      log(`HGH selection status error: ${err.message}`, 'hgh-selection.routes');
      res.status(500).json({ message: err.message || 'HGH selection status failed' });
    }
  });

  app.post('/api/test/hgh-selection-reminder', async (_req, res) => {
    try {
      await checkHGHSelectionAndNotify();
      res.json({ ok: true, message: 'HGH Selection reminder fired' });
    } catch (err) {
      log(`HGH selection reminder test failed: ${String(err)}`, 'hgh-selection.routes');
      res.status(500).json({ ok: false, message: String(err) });
    }
  });
}
