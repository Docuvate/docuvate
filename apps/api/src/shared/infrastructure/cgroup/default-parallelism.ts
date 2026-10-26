// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';

const DEFAULT_RESIDENT_BYTES = 550_000_000;
const DEFAULT_BASE_HEADROOM_BYTES = 450_000_000;
const MAX_DEFAULT_CONCURRENCY = 4;

function readCgroupInt(paths: string[]): number | null {
  for (const path of paths) {
    try {
      const first = readFileSync(path, 'utf8').trim().split(/\s+/)[0];
      if (!first || first === 'max') {
        continue;
      }
      const parsed = Number.parseInt(first, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function cgroupMemoryLimitBytes(): number | null {
  return readCgroupInt([
    '/sys/fs/cgroup/memory.max',
    '/sys/fs/cgroup/memory/memory.limit_in_bytes',
  ]);
}

/** Heuristic parallel document-extraction jobs (API BullMQ consumer). */
export function defaultDocumentExtractionConcurrency(): number {
  const cpuCount = Math.max(1, cpus().length);
  const jobsByCpu = Math.max(1, Math.floor(cpuCount / 2));
  const limit = cgroupMemoryLimitBytes();
  if (limit === null) {
    return Math.min(MAX_DEFAULT_CONCURRENCY, jobsByCpu);
  }
  const availableForJobs = Math.max(0, limit - DEFAULT_BASE_HEADROOM_BYTES);
  const jobsByMem = Math.max(1, Math.floor(availableForJobs / DEFAULT_RESIDENT_BYTES));
  return Math.max(1, Math.min(MAX_DEFAULT_CONCURRENCY, jobsByMem, jobsByCpu));
}
