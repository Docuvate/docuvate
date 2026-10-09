// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { workerApiUrl } from './worker-api-path.js';

const DEFAULT_DEPENDENCY_TIMEOUT_MS = 2_500;

export function workerDependencyTimeoutMs(): number {
  const raw = process.env['WORKER_DEPENDENCY_TIMEOUT_MS'];
  if (!raw) {
    return DEFAULT_DEPENDENCY_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DEPENDENCY_TIMEOUT_MS;
  }
  return parsed;
}

/** Bounded fetch for optional worker probes (settings catalog, readiness). */
export async function fetchWorkerDependency(
  workerUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<Response | null> {
  const timeoutMs = workerDependencyTimeoutMs();
  try {
    return await fetch(workerApiUrl(workerUrl, path), {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}
