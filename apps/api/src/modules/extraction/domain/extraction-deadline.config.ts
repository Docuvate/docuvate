// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const DEFAULT_MAX_DEADLINE_RETRIES = 3;
const DEFAULT_WORKER_FETCH_TIMEOUT_MS = 420_000;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

/** BullMQ attempts for worker extract deadline / client-abort 503s before marking failed. */
export function extractionDeadlineMaxRetries(): number {
  return parsePositiveInt(process.env['DOCUMENT_EXTRACTION_DEADLINE_MAX_RETRIES'], DEFAULT_MAX_DEADLINE_RETRIES);
}

/** Abort API→worker /extract fetch after this (should exceed worker wall-clock deadline). */
export function extractionWorkerFetchTimeoutMs(): number {
  return parsePositiveInt(
    process.env['DOCUMENT_EXTRACTION_WORKER_TIMEOUT_MS'],
    DEFAULT_WORKER_FETCH_TIMEOUT_MS
  );
}

export const EXTRACTION_DEADLINE_FAILURE_I18N_KEY = 'documents.errors.extractionDeadlineExceeded';
