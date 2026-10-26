// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { isRecord, parseNumber } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

export interface WorkerExtractCapacity {
  recommendedConcurrentExtractions: number;
  activeExtractJobs: number;
  extractSlotsFree: number;
  memoryAvailableBytes: number | null;
}

function parseCapacityBody(raw: unknown): WorkerExtractCapacity | null {
  if (!isRecord(raw)) {
    return null;
  }
  const recommended = parseNumber(
    raw.recommendedConcurrentExtractions ?? raw.recommended_concurrent_extractions,
    0
  );
  if (recommended < 1) {
    return null;
  }
  return {
    recommendedConcurrentExtractions: recommended,
    activeExtractJobs: Math.max(
      0,
      parseNumber(raw.activeExtractJobs ?? raw.active_extract_jobs, 0)
    ),
    extractSlotsFree: Math.max(
      0,
      parseNumber(raw.extractSlotsFree ?? raw.extract_slots_free, 0)
    ),
    memoryAvailableBytes:
      raw.memoryAvailableBytes === null || raw.memory_available_bytes === null
        ? null
        : parseNumber(raw.memoryAvailableBytes ?? raw.memory_available_bytes, 0),
  };
}

export async function fetchWorkerExtractCapacity(
  workerUrl: string
): Promise<WorkerExtractCapacity | null> {
  const url = workerApiUrl(workerUrl, '/health/capacity');
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) {
      return null;
    }
    const raw: unknown = await response.json();
    return parseCapacityBody(raw);
  } catch {
    return null;
  }
}
