// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { EXTRACTION_DEADLINE_FAILURE_I18N_KEY } from './extraction-deadline.config.js';
import { EXTRACTION_TIMEOUT_FAILURE_MESSAGE } from './extraction-queue-failures.js';

/** Typed extraction failure codes carried from the worker response to the stored document status. */
export type ExtractionFailureCode =
  | 'worker_unreachable'
  | 'worker_unavailable'
  | 'worker_busy'
  | 'worker_deadline'
  | 'worker_timeout'
  | 'document_unprocessable'
  | 'resource_exhausted'
  | 'worker_error'
  | 'claim_busy'
  | 'internal_error'
  | 'orphan_requeue_exhausted';

const RETRYABLE_BY_CODE: Readonly<Record<ExtractionFailureCode, boolean>> = {
  worker_unreachable: true,
  worker_unavailable: true,
  worker_busy: true,
  worker_deadline: true,
  worker_timeout: false,
  document_unprocessable: false,
  resource_exhausted: false,
  worker_error: false,
  claim_busy: true,
  internal_error: false,
  orphan_requeue_exhausted: false,
};

export function isRetryableExtractionFailureCode(code: ExtractionFailureCode): boolean {
  return RETRYABLE_BY_CODE[code];
}

/** i18n key stored as `documents.failure_reason`; one key per code. */
export function extractionFailureReasonKey(code: ExtractionFailureCode): string {
  switch (code) {
    case 'worker_timeout':
      return EXTRACTION_TIMEOUT_FAILURE_MESSAGE;
    case 'worker_deadline':
      return EXTRACTION_DEADLINE_FAILURE_I18N_KEY;
    case 'worker_unreachable':
    case 'worker_unavailable':
    case 'worker_busy':
    case 'document_unprocessable':
    case 'resource_exhausted':
    case 'worker_error':
    case 'claim_busy':
    case 'internal_error':
    case 'orphan_requeue_exhausted':
      return `documents.extractionFailureCode.${code}`;
  }
}

export class ExtractionFailure extends Error {
  readonly code: ExtractionFailureCode;
  readonly retryable: boolean;

  constructor(code: ExtractionFailureCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'ExtractionFailure';
    this.code = code;
    this.retryable = isRetryableExtractionFailureCode(code);
  }
}

/** Any error that did not come typed from the extraction path is an internal (permanent) failure. */
export function toExtractionFailure(error: unknown): ExtractionFailure {
  if (error instanceof ExtractionFailure) {
    return error;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new ExtractionFailure('internal_error', detail);
}
