// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const DEFAULT_MAX_ORPHAN_REQUEUES = 3;
const DEFAULT_ORPHAN_BATCH_SIZE = 100;

function positiveIntFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** How often one document may be re-enqueued as an orphan before it is marked failed. */
export function maxOrphanExtractionRequeues(): number {
  return positiveIntFromEnv('DOCUMENT_EXTRACTION_ORPHAN_MAX_REQUEUES', DEFAULT_MAX_ORPHAN_REQUEUES);
}

/** Rows scanned per reconcile tick (oldest first). */
export function orphanExtractionBatchSize(): number {
  return positiveIntFromEnv('DOCUMENT_EXTRACTION_ORPHAN_BATCH_SIZE', DEFAULT_ORPHAN_BATCH_SIZE);
}

export type OrphanRequeuePlan = 'requeue' | 'fail';

/** `requeueCount` includes the requeue being decided now. */
export function planOrphanRequeue(requeueCount: number, maxRequeues: number): OrphanRequeuePlan {
  return requeueCount > maxRequeues ? 'fail' : 'requeue';
}
