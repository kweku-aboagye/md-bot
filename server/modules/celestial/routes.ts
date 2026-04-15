import type { Express } from 'express';
import { log } from '../../core/logging/log';
import { getTargetSunday } from '../../core/scheduling/target-sunday';
import { checkCelestialHymn, runCelestialCheck } from './service';

export function registerCelestialRoutes(app: Express) {
  app.get('/api/celestial/status', async (_req, res) => {
    try {
      res.json(await checkCelestialHymn(getTargetSunday()));
    } catch (err: any) {
      log(`Celestial status error: ${err.message}`, 'celestial.routes');
      res.status(500).json({ message: err.message || 'Celestial status failed' });
    }
  });

  app.post('/api/test/celestial-reminder', async (_req, res) => {
    try {
      await runCelestialCheck('manual');
      res.json({ ok: true, message: 'Celestial reminder fired' });
    } catch (err) {
      log(`Celestial reminder test failed: ${String(err)}`, 'celestial.routes');
      res.status(500).json({ ok: false, message: String(err) });
    }
  });
}
