import { desc } from 'drizzle-orm';
import { db } from './index';
import { emailHistory } from './schema';
import type {
  EmailHistoryEntry,
  EmailHistoryRecordInput,
} from '../email/history';
import { createEmailHistoryId } from '../email/history';

export interface IStorage {
  saveEmailHistory(records: EmailHistoryRecordInput[]): Promise<void>;
  getEmailHistory(limit?: number): Promise<EmailHistoryEntry[]>;
}

function isMissingRelationError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '42P01';
}

function storageWarn(message: string) {
  console.warn(`[storage] ${message}`);
}

export class DatabaseStorage implements IStorage {
  async saveEmailHistory(records: EmailHistoryRecordInput[]): Promise<void> {
    if (records.length === 0) return;

    try {
      await db.insert(emailHistory).values(
        records.map((record) => ({
          id: createEmailHistoryId(),
          runId: record.runId,
          module: record.module,
          kind: record.kind,
          trigger: record.trigger,
          recipient: record.recipient,
          subject: record.subject,
          targetSunday: record.targetSunday ?? null,
          sentAt: new Date(record.sentAt),
          messageId: record.messageId ?? null,
          payload: record.payload,
        }))
      );
    } catch (error) {
      if (isMissingRelationError(error)) {
        storageWarn('email_history table is missing; skipping history write');
        return;
      }
      throw error;
    }
  }

  async getEmailHistory(limit = 10): Promise<EmailHistoryEntry[]> {
    let rows;
    try {
      rows = await db
        .select()
        .from(emailHistory)
        .orderBy(desc(emailHistory.sentAt))
        .limit(limit);
    } catch (error) {
      if (isMissingRelationError(error)) {
        storageWarn('email_history table is missing; returning empty history');
        return [];
      }
      throw error;
    }

    return rows.map((row) => ({
      id: row.id,
      runId: row.runId,
      module: row.module,
      kind: row.kind,
      trigger: row.trigger,
      recipient: row.recipient,
      subject: row.subject,
      targetSunday: row.targetSunday,
      sentAt: row.sentAt.toISOString(),
      messageId: row.messageId,
      payload: row.payload,
    }));
  }
}

export const storage = new DatabaseStorage();
