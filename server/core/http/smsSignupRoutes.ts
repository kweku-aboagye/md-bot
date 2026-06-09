import { randomUUID } from 'crypto';
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { smsOptIn } from '../db/schema';
import { log } from '../logging/log';
import { sendTrackedSms } from '../sms/texter';

const OPT_IN_BODY =
  "🤖 You're now opted in to SMS reminders from Kweku Aboagye. Msg frequency ~2-6/mo. Msg&Data rates may apply. Reply STOP to cancel, HELP for help.";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return null;
}

const signupSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

export function registerSmsSignupRoutes(app: Express): void {
  app.post('/api/sms-signup', async (req: Request, res: Response) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      res.status(400).json({ message: 'Please enter a valid US phone number.' });
      return;
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : null)
      ?? req.socket.remoteAddress
      ?? null;

    const runId = `signup_${randomUUID()}`;

    let sendResult;
    try {
      sendResult = await sendTrackedSms({ to: phone, body: OPT_IN_BODY, module: 'sms-signup', trigger: 'manual', runId });
    } catch (err: any) {
      log(`Opt-in SMS failed for signup: ${err.message}`, 'sms-signup');
    }

    if (sendResult?.optedOut.has(phone)) {
      res.status(400).json({ message: 'This number has previously opted out. Reply START to re-subscribe, then try again.' });
      return;
    }

    try {
      await db.insert(smsOptIn).values({
        id: `opt_${randomUUID()}`,
        phone,
        ip,
        consentedAt: new Date(),
      });
    } catch (err: any) {
      log(`Failed to store opt-in record: ${err.message}`, 'sms-signup');
    }

    res.json({ ok: true });
  });
}
