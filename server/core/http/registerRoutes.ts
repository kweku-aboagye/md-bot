import type { Express } from 'express';
import type { Server } from 'http';
import { storage } from '../db/storage';
import { sendEmail } from '../email/mailer';
import { log } from '../logging/log';
import { getNextScheduledRun } from '../scheduling/scheduler';
import { getTargetSunday } from '../scheduling/target-sunday';
import type { MinistryStatus } from './types';
import { checkCelestialHymn } from '../../modules/celestial/service';
import { registerCelestialRoutes } from '../../modules/celestial/routes';
import { registerHghGapRoutes } from '../../modules/hgh-gap/routes';
import { runHghGapFinder } from '../../modules/hgh-gap/service';
import { registerHghSelectionRoutes } from '../../modules/hgh-selection/routes';
import { getPwValidationSnapshot } from '../../modules/pw/service';
import { registerPwRoutes } from '../../modules/pw/routes';
import { compileZamarPrepList } from '../../modules/zamar/service';
import { registerZamarRoutes } from '../../modules/zamar/routes';

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({ pinRequired: !!process.env.DASHBOARD_PIN });
  });

  app.get('/api/history', async (_req, res) => {
    res.json(await storage.getEmailHistory(10));
  });

  app.get('/api/schedule', (_req, res) => {
    res.json(getNextScheduledRun());
  });

  app.get('/api/ministry/status', async (_req, res) => {
    const targetSunday = getTargetSunday();
    const status: MinistryStatus = {
      targetSunday: targetSunday.toISOString().split('T')[0],
      ranAt: new Date().toISOString(),
      pw: { services: [] },
      hgh: null,
      celestial: null,
      zamar: null,
    };

    const [pwResult, hghResult, celestialResult, zamarResult] = await Promise.allSettled([
      getPwValidationSnapshot(targetSunday),
      runHghGapFinder(),
      checkCelestialHymn(targetSunday),
      compileZamarPrepList(targetSunday),
    ]);

    if (pwResult.status === 'fulfilled') {
      status.pw.services = pwResult.value;
    } else {
      status.pw.error = pwResult.reason?.message || 'P&W check failed';
      log(`Ministry status P&W error: ${status.pw.error}`, 'http');
    }

    if (hghResult.status === 'fulfilled') {
      status.hgh = hghResult.value;
    } else {
      log(`Ministry status HGH error: ${hghResult.reason?.message}`, 'http');
    }

    if (celestialResult.status === 'fulfilled') {
      status.celestial = celestialResult.value;
    } else {
      log(`Ministry status Celestial error: ${celestialResult.reason?.message}`, 'http');
    }

    if (zamarResult.status === 'fulfilled') {
      status.zamar = zamarResult.value;
    } else {
      log(`Ministry status Zamar error: ${zamarResult.reason?.message}`, 'http');
    }

    res.json(status);
  });

  app.post('/api/test/send-email', async (_req, res) => {
    const to = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    if (!to) {
      res.status(500).json({ message: 'ADMIN_EMAIL or GMAIL_USER not set in .env' });
      return;
    }

    try {
      await sendEmail({
        to,
        subject: 'MD Bot 🤖 — test email ✅',
        body: 'If you received this, MD Bot email delivery is working correctly.',
      });
      res.json({ ok: true, sentTo: to });
    } catch (err: any) {
      log(`Test email failed: ${err.message}`, 'http');
      res.status(500).json({ message: err.message });
    }
  });

  registerPwRoutes(app);
  registerCelestialRoutes(app);
  registerHghSelectionRoutes(app);
  registerHghGapRoutes(app);
  registerZamarRoutes(app);

  return httpServer;
}
