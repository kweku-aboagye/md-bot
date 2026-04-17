import { randomUUID } from 'crypto';
import { db } from '../db';
import { smsHistory } from '../db/schema';
import { log } from '../logging/log';

export interface SendTrackedSmsArgs {
  to: string | string[];
  body: string;
  module: string;
  trigger: 'scheduled' | 'manual';
  runId: string;
}

function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '•'.repeat(Math.max(0, phone.length - 5)) + phone.slice(-2);
}

async function createTwilioClient() {
  // Dynamic import defers Twilio loading until send time so the app can boot without Twilio configured
  const twilio = await import('twilio');
  return twilio.default(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function sendTrackedSms(args: SendTrackedSmsArgs): Promise<void> {
  if (!isTwilioConfigured()) return;

  const recipients = Array.isArray(args.to) ? args.to : [args.to];
  if (recipients.length === 0) return;

  const client = await createTwilioClient();

  await Promise.all(
    recipients.map(async (phone) => {
      let messageSid: string | null = null;
      let status = 'sent';
      let error: string | null = null;

      try {
        const message = await client.messages.create({
          body: args.body,
          from: process.env.TWILIO_FROM_NUMBER!,
          to: phone,
        });
        messageSid = message.sid ?? null;
        if (!messageSid) throw new Error('Twilio returned no message SID');
        log(`SMS sent to ${maskPhone(phone)} (${args.module})`, 'texter');
      } catch (err: any) {
        status = 'failed';
        error = err.message || String(err);
        log(`SMS failed to ${maskPhone(phone)}: ${error}`, 'texter');
      }

      try {
        await db.insert(smsHistory).values({
          id: `sms_${randomUUID()}`,
          runId: args.runId,
          module: args.module,
          trigger: args.trigger,
          recipient: phone,
          body: args.body,
          messageSid,
          sentAt: new Date(),
          status,
          error,
        });
      } catch (err: any) {
        log(`SMS sent but failed to persist history: ${err.message}`, 'texter');
      }
    })
  );
}

export function getAdminPhone(): string | null {
  return process.env.ADMIN_PHONE?.trim() || null;
}
