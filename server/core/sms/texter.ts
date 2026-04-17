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
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

function generateId(): string {
  return `sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '•'.repeat(Math.max(0, phone.length - 5)) + phone.slice(-2);
}

async function sendViaTwilio(to: string, body: string): Promise<string | null> {
  // Dynamic import so the app boots without twilio installed or configured
  const twilio = await import('twilio');
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_FROM_NUMBER!,
    to,
  });

  return message.sid ?? null;
}

export async function sendTrackedSms(args: SendTrackedSmsArgs): Promise<void> {
  if (!isTwilioConfigured()) {
    log('Twilio not configured — skipping SMS', 'texter');
    return;
  }

  const recipients = Array.isArray(args.to) ? args.to : [args.to];
  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map(async (phone) => {
      let messageSid: string | null = null;
      let status = 'sent';
      let error: string | null = null;

      try {
        messageSid = await sendViaTwilio(phone, args.body);
        log(`SMS sent to ${maskPhone(phone)} (${args.module})`, 'texter');
      } catch (err: any) {
        status = 'failed';
        error = err.message || String(err);
        log(`SMS failed to ${maskPhone(phone)}: ${error}`, 'texter');
      }

      try {
        await db.insert(smsHistory).values({
          id: generateId(),
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
