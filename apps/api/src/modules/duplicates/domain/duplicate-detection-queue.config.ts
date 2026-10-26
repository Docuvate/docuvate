// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const DUPLICATE_DETECTION_QUEUE_NAME = 'document-duplicate-detection';

export function duplicateDetectionQueueConcurrency(): number {
  return parseIntEnv('DOCUVATE_DUPLICATE_QUEUE_CONCURRENCY', 2);
}

export function duplicateDetectionJobId(documentId: string): string {
  return `duplicate-detect-${documentId}`;
}
