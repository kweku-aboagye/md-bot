import type { Express } from 'express';
import type { Server } from 'http';
import { sendEmail } from '../email/mailer';
import { log } from '../logging/log';
import { getNextScheduledRun } from '../scheduling/scheduler';
import { registerContactsRoutes } from './contactsRoutes';
import { registerCelestialRoutes } from '../../modules/celestial/routes';
import { registerHghGapRoutes } from '../../modules/hgh-gap/routes';
import { registerHghSelectionRoutes } from '../../modules/hgh-selection/routes';
import { registerPwRoutes } from '../../modules/pw/routes';
import { registerZamarRoutes } from '../../modules/zamar/routes';

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({ pinRequired: !!process.env.DASHBOARD_PIN });
  });

  app.get('/api/schedule', (_req, res) => {
    res.json(getNextScheduledRun());
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
  registerContactsRoutes(app);

  return httpServer;
}
