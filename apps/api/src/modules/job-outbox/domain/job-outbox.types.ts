/** Canonical job type codes stored in `job_types` (3NF lookup). */
export const JOB_TYPE_DOCUMENT_EXTRACTION = 'document-extraction';

export type JobTypeCode = 'document-extraction';

export type JobOutboxStatus = 'pending' | 'enqueued' | 'running' | 'done' | 'failed';

export const JOB_OUTBOX_STATUSES: ReadonlyArray<JobOutboxStatus> = [
  'pending',
  'enqueued',
  'running',
  'done',
  'failed',
];

export type JobOutboxRecord = {
  id: string;
  jobType: JobTypeCode;
  documentId: string;
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
};

export type ScheduleDocumentExtractionResult = {
  outboxId: string;
  created: boolean;
};

export function documentExtractionIdempotencyKey(documentId: string): string {
  return `${JOB_TYPE_DOCUMENT_EXTRACTION}:${documentId}`;
}

/** Exponential backoff: 2s, 4s, 8s, … capped at 60s. */
export function computeRetryDelayMs(attemptsAfterFailure: number): number {
  const baseMs = 2_000;
  const exp = Math.max(0, attemptsAfterFailure - 1);
  return Math.min(baseMs * 2 ** exp, 60_000);
}

export function isActiveOutboxStatus(status: JobOutboxStatus): boolean {
  return status === 'pending' || status === 'enqueued' || status === 'running';
}

export function parseJobOutboxStatus(value: string): JobOutboxStatus | null {
  switch (value) {
    case 'pending':
    case 'enqueued':
    case 'running':
    case 'done':
    case 'failed':
      return value;
    default:
      return null;
  }
}

export function parseJobTypeCode(value: string): JobTypeCode | null {
  if (value === JOB_TYPE_DOCUMENT_EXTRACTION) {
    return value;
  }
  return null;
}
