import { db } from './index';
import { emailHistory } from './schema';
import type {
  EmailHistoryRecordInput,
} from '../email/history';
import { createEmailHistoryId } from '../email/history';

function isMissingRelationError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '42P01';
}

function storageWarn(message: string) {
  console.warn(`[storage] ${message}`);
}

class DatabaseStorage {
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

}

export const storage = new DatabaseStorage();
