// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { DocumentStatus } from '../../documents/domain/document.entity.js';
import {
  type ExtractionFailure,
  extractionFailureReasonKey,
  toExtractionFailure,
} from './extraction-failure.js';

export type ProcessorFailurePlan =
  | { kind: 'retry' }
  | { kind: 'unrecoverable' }
  | { kind: 'fail_document'; failureReason: string };

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
