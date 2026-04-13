import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type {
  EmailHistoryKind,
  EmailHistoryModule,
  EmailHistoryPayload,
  EmailTrigger,
} from '../email/history';

export const emailHistory = pgTable('email_history', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  module: text('module').$type<EmailHistoryModule>().notNull(),
  kind: text('kind').$type<EmailHistoryKind>().notNull(),
  trigger: text('trigger').$type<EmailTrigger>().notNull(),
  recipient: text('recipient').notNull(),
  subject: text('subject').notNull(),
  targetSunday: text('target_sunday'),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
  messageId: text('message_id'),
  payload: jsonb('payload').$type<EmailHistoryPayload>().notNull(),
});
