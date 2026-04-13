import nodemailer from 'nodemailer';
import { storage } from '../db/storage';
import { log } from '../logging/log';
import type { EmailHistoryMetadata } from './history';

type EmailProvider = 'gmail' | 'resend';

export interface EmailSendResult {
  provider: EmailProvider;
  messageId: string | null;
}

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

function getEmailProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (configured === 'gmail' || configured === 'resend') {
    return configured;
  }

  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';

  throw new Error(
    'No email provider configured. Set RESEND_API_KEY (recommended for Railway) or GMAIL_USER/GMAIL_APP_PASSWORD.'
  );
}

function createGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must both be set for Gmail delivery.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

async function sendViaGmail({
  to,
  subject,
  body,
  html,
}: SendEmailArgs): Promise<EmailSendResult> {
  const info = await createGmailTransporter().sendMail({
    from: process.env.GMAIL_USER,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    text: body,
    html: html ?? body,
  });

  return {
    provider: 'gmail',
    messageId: typeof info.messageId === 'string' ? info.messageId : null,
  };
}

async function sendViaResend({
  to,
  subject,
  body,
  html,
}: SendEmailArgs): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY must be set for Resend delivery.');
  }

  if (!from) {
    throw new Error('RESEND_FROM_EMAIL must be set for Resend delivery.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: normalizeRecipients(to),
        subject,
        text: body,
        html: html ?? body,
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: { id?: string; message?: string; error?: { message?: string } } = {};

    if (raw) {
      try {
        data = JSON.parse(raw) as { id?: string; message?: string; error?: { message?: string } };
      } catch {
        data = { message: raw };
      }
    }

    if (!response.ok) {
      const message = data.error?.message || data.message || `HTTP ${response.status}`;
      throw new Error(`Resend API error: ${message}`);
    }

    return {
      provider: 'resend',
      messageId: typeof data.id === 'string' ? data.id : null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Resend API request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: SendEmailArgs): Promise<EmailSendResult> {
  const provider = getEmailProvider();

  if (provider === 'resend') {
    return sendViaResend({ to, subject, body, html });
  }

  return sendViaGmail({ to, subject, body, html });
}

export async function sendTrackedEmail({
  history,
  ...emailArgs
}: SendTrackedEmailArgs): Promise<EmailSendResult> {
  const recipients = normalizeRecipients(emailArgs.to);
  const info = await sendEmail(emailArgs);
  const sentAt = new Date().toISOString();
  const messageId = info.messageId;

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

  log(`Email sent via ${info.provider} for ${history.kind}`, 'mailer');
  return info;
}
