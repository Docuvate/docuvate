// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

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
