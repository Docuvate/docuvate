// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { DocumentStatus } from '../../documents/domain/document.entity.js';
import {
  computeRetryDelayMs,
  type JobOutboxStatus,
} from '../../job-outbox/domain/job-outbox.types.js';
import {
  type ExtractionFailure,
  extractionFailureReasonKey,
  toExtractionFailure,
} from './extraction-failure.js';

type ProcessorFailurePlan =
  { kind: 'retry' } | { kind: 'unrecoverable' } | { kind: 'fail_document'; failureReason: string };

/** Decide what the BullMQ processor does with a typed extraction failure (BullMQ is the only retry owner). */
export function planProcessorFailure(input: {
  failure: ExtractionFailure;
  attemptsMade: number;
  deadlineMaxRetries: number;
}): ProcessorFailurePlan {
  const { failure } = input;
  if (!failure.retryable) {
    return { kind: 'unrecoverable' };
  }
  if (failure.code === 'worker_deadline' && input.attemptsMade + 1 >= input.deadlineMaxRetries) {
    return { kind: 'fail_document', failureReason: extractionFailureReasonKey(failure.code) };
  }
  return { kind: 'retry' };
}

export interface ExtractionAttemptFailurePlan {
  allowRetry: boolean;
  delayMs: number;
}

/**
 * Outbox attempt count is 1-based (incremented when the attempt starts).
 * BullMQ `attemptsMade` is not the retry counter: each outbox delivery uses `attempts: 1`.
 */
export function planExtractionAttemptFailure(input: {
  failure: ExtractionFailure;
  outboxAttempts: number;
  maxAttempts: number;
  deadlineMaxRetries: number;
}): ExtractionAttemptFailurePlan {
  const deadlineCap = input.failure.code === 'worker_deadline' ? input.deadlineMaxRetries : null;
  const cappedByDeadline = deadlineCap !== null && input.outboxAttempts >= deadlineCap;
  const cappedByOutbox = input.outboxAttempts >= input.maxAttempts;
  if (!input.failure.retryable || cappedByDeadline || cappedByOutbox) {
    return { allowRetry: false, delayMs: 0 };
  }
  return { allowRetry: true, delayMs: computeRetryDelayMs(input.outboxAttempts) };
}

/**
 * The BullMQ `failed` event fires for an outbox retry that was deliberately finished
 * as unrecoverable in the queue. Only a terminal outbox row may persist document failure.
 * `null` means the job has no outbox row.
 */
export function shouldPersistTerminalExtractionFailure(
  outboxStatus: JobOutboxStatus | null
): boolean {
  if (outboxStatus === null) {
    return true;
  }
  return outboxStatus === 'failed';
}

const NON_TERMINAL_STATUSES: ReadonlySet<DocumentStatus> = new Set<DocumentStatus>([
  'queued',
  'extracting',
  'uploaded',
]);

/**
 * Called from the queue's `failed` event. When the job is finally failed (no further BullMQ
 * attempt, including stalled-limit exhaustion) and the document was left non-terminal,
 * returns the typed failure reason to persist; otherwise null.
 */
export function planExtractionJobFailed(input: {
  jobName: string;
  jobFinallyFailed: boolean;
  documentStatus: DocumentStatus | null;
  error: unknown;
}): string | null {
  if (input.jobName !== 'extract' || !input.jobFinallyFailed || input.documentStatus === null) {
    return null;
  }
  if (!NON_TERMINAL_STATUSES.has(input.documentStatus)) {
    return null;
  }
  return extractionFailureReasonKey(toExtractionFailure(input.error).code);
}
