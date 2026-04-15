import { randomUUID } from 'crypto';

export type EmailTrigger = 'scheduled' | 'manual';

export type EmailHistoryModule =
  | 'pw'
  | 'celestial'
  | 'hgh-selection'
  | 'hgh-gap'
  | 'zamar';

export type EmailHistoryKind =
  | 'pw_leader_reminder'
  | 'pw_admin_missing_leader'
  | 'celestial_missing_hymn'
  | 'hgh_selection_reminder'
  | 'hgh_gap_report'
  | 'zamar_prep_list';

export type EmailHistoryPayload = Record<string, unknown>;

export interface EmailHistoryRecordInput {
  runId: string;
  module: EmailHistoryModule;
  kind: EmailHistoryKind;
  trigger: EmailTrigger;
  recipient: string;
  subject: string;
  targetSunday?: string | null;
  sentAt: string;
  messageId?: string | null;
  payload: EmailHistoryPayload;
}

export interface EmailHistoryMetadata {
  runId: string;
  module: EmailHistoryModule;
  kind: EmailHistoryKind;
  trigger: EmailTrigger;
  targetSunday?: string | null;
  payload: EmailHistoryPayload;
}

export function createRunId(): string {
  return randomUUID();
}

export function createEmailHistoryId(): string {
  return randomUUID();
}
