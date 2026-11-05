// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Canonical job type codes stored in `job_types` (3NF lookup). */
export const JOB_TYPE_DOCUMENT_EXTRACTION = 'document-extraction';

export type JobTypeCode = 'document-extraction';

export type JobOutboxStatus = 'pending' | 'enqueued' | 'running' | 'done' | 'failed';

const JOB_OUTBOX_STATUSES: readonly JobOutboxStatus[] = [
  'pending',
  'enqueued',
  'running',
  'done',
  'failed',
];

export interface JobOutboxRecord {
  id: string;
  jobType: JobTypeCode;
  documentId: string;
  userId: string;
  idempotencyKey: string;
  status: JobOutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  enqueuedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface ScheduleDocumentExtractionResult {
  outboxId: string;
  created: boolean;
}

export function documentExtractionIdempotencyKey(documentId: string): string {
  return `${JOB_TYPE_DOCUMENT_EXTRACTION}:${documentId}`;
}

/** Exponential backoff: 2s, 4s, 8s, … capped at 60s. */
export function computeRetryDelayMs(attemptsAfterFailure: number): number {
  const baseMs = 2_000;
  const exp = Math.max(0, attemptsAfterFailure - 1);
  return Math.min(baseMs * 2 ** exp, 60_000);
}


export function parseJobOutboxStatus(value: string): JobOutboxStatus | null {
  for (const status of JOB_OUTBOX_STATUSES) {
    if (status === value) {
      return status;
    }
  }
  return null;
}

export function parseJobTypeCode(value: string): JobTypeCode | null {
  if (value === JOB_TYPE_DOCUMENT_EXTRACTION) {
    return value;
  }
  return null;
}
