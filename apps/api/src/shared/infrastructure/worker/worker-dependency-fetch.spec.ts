// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWorkerDependency, workerDependencyTimeoutMs } from './worker-dependency-fetch.js';

describe('workerDependencyTimeoutMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to 2500ms', () => {
    expect(workerDependencyTimeoutMs()).toBe(2500);
  });

  it('reads WORKER_DEPENDENCY_TIMEOUT_MS', () => {
    vi.stubEnv('WORKER_DEPENDENCY_TIMEOUT_MS', '1200');
    expect(workerDependencyTimeoutMs()).toBe(1200);
  });
});

describe('fetchWorkerDependency', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns null on timeout instead of hanging', async () => {
    vi.stubEnv('WORKER_DEPENDENCY_TIMEOUT_MS', '50');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error('aborted')), 500);
        })
    );

    const result = await fetchWorkerDependency('http://worker:8000', '/settings/hardware');

    expect(result).toBeNull();
    fetchMock.mockRestore();
  });
});
