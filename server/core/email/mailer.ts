import nodemailer, { type SentMessageInfo } from 'nodemailer';
import { storage } from '../db/storage';
import { log } from '../logging/log';
import type { EmailHistoryMetadata } from './history';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  body?: string;
  html?: string;
}

export interface SendTrackedEmailArgs extends SendEmailArgs {
  history: EmailHistoryMetadata;
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: SendEmailArgs): Promise<SentMessageInfo> {
  return transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    text: body,
    html: html ?? body,
  });
}

export async function sendTrackedEmail({
  history,
  ...emailArgs
}: SendTrackedEmailArgs): Promise<SentMessageInfo> {
  const recipients = normalizeRecipients(emailArgs.to);
  const info = await sendEmail(emailArgs);
  const sentAt = new Date().toISOString();
  const messageId =
    typeof (info as { messageId?: unknown }).messageId === 'string'
      ? ((info as { messageId?: string }).messageId ?? null)
      : null;

  try {
    await storage.saveEmailHistory(
      recipients.map((recipient) => ({
        runId: history.runId,
        module: history.module,
        kind: history.kind,
        trigger: history.trigger,
        recipient,
        subject: emailArgs.subject,
        targetSunday: history.targetSunday ?? null,
        sentAt,
        messageId,
        payload: history.payload,
      }))
    );
  } catch (error: any) {
    log(
      `Email sent but failed to persist history for ${history.kind}: ${error.message || String(error)}`,
      'mailer'
    );
  }

  return info;
}
