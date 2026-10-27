// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { isWorkerExtractDeadlineFailureMessage } from './extraction-worker-errors.js';

/** Stored on the document and mapped to `documents.extractionFailedTimeout` in the web app. */
export const EXTRACTION_TIMEOUT_FAILURE_MESSAGE = 'documents.extractionFailedTimeout';

/** Worker 422 and extract-deadline timeouts are permanent; do not BullMQ-retry. */
export function isPermanentExtractionFailureMessage(message: string): boolean {
  return (
    message.includes('Worker extraction failed: 422') ||
    message.includes(EXTRACTION_TIMEOUT_FAILURE_MESSAGE) ||
    message.includes('Worker extraction timeout')
  );
}

export function isRetryableExtractionFailureMessage(message: string): boolean {
  if (isPermanentExtractionFailureMessage(message)) {
    return false;
  }
  if (isWorkerExtractDeadlineFailureMessage(message)) {
    return true;
  }
  return (
    message.includes('document extraction already in progress') ||
    message.includes('fetch failed') ||
    message.includes('Worker extraction unavailable') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('Worker extraction failed: 503')
  );
}
