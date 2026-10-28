// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { clampExtractionSlots } from './extraction-slots.js';

const DEFAULT_LOCK_MS = 20 * 60 * 1000;
const DEFAULT_STALLED_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_STALLED_COUNT = 2;
const DEFAULT_STALE_CLAIM_SECONDS = 18 * 60;

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

/** BullMQ lock must cover worker extract + API post-OCR persistence (often >15 min). */
export function extractionQueueLockDurationMs(): number {
  return parsePositiveInt(process.env['DOCUMENT_EXTRACTION_LOCK_DURATION_MS'], DEFAULT_LOCK_MS);
}

export function extractionQueueStalledIntervalMs(): number {
  return parsePositiveInt(
    process.env['DOCUMENT_EXTRACTION_STALLED_INTERVAL_MS'],
    DEFAULT_STALLED_INTERVAL_MS
  );
}

export function extractionQueueMaxStalledCount(): number {
  return parsePositiveInt(
    process.env['DOCUMENT_EXTRACTION_MAX_STALLED_COUNT'],
    DEFAULT_MAX_STALLED_COUNT
  );
}

/** Re-claim `extracting` rows older than this when a stalled job retries. */
export function extractionStaleClaimSeconds(): number {
  return parsePositiveInt(
    process.env['DOCUMENT_EXTRACTION_STALE_CLAIM_SECONDS'],
    DEFAULT_STALE_CLAIM_SECONDS
  );
}

export function extractionJobId(documentId: string): string {
  return `document-extract-${documentId}`;
}

/**
 * BullMQ worker concurrency for `document-extraction`: follows the worker's advertised
 * capacity so no second job is fetched (and holds a lock) while the worker can only run one.
 * `DOCUMENT_EXTRACTION_CONCURRENCY` caps it further.
 */
export function documentExtractionConcurrency(workerSlots: number): number {
  const slots = clampExtractionSlots(workerSlots);
  const configured = parsePositiveInt(process.env['DOCUMENT_EXTRACTION_CONCURRENCY'], 0);
  if (configured > 0) {
    return Math.min(slots, clampExtractionSlots(configured));
  }
  return slots;
}
