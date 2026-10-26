// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import {
  assertBullFixedJobIdQueued,
  clearStaleBullJobForFixedId,
  prepareBullFixedJobIdForAdd,
} from './bullmq-fixed-job-id.js';

function mockJob(state: string, overrides?: { retry?: () => Promise<void> }) {
  return {
    getState: vi.fn(() => Promise.resolve(state)),
    retry: overrides?.retry ?? vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
}

describe('bullmq-fixed-job-id', () => {
  it('removes completed jobs before re-add', async () => {
    const job = mockJob('completed');
    await clearStaleBullJobForFixedId(job);
    expect(job.remove).toHaveBeenCalled();
  });

  it('retries failed jobs when retry succeeds', async () => {
    const job = mockJob('failed', {
      retry: vi.fn(() => {
        job.getState = vi.fn(() => Promise.resolve('waiting'));
        return Promise.resolve();
      }),
    });
    await clearStaleBullJobForFixedId(job);
    expect(job.retry).toHaveBeenCalled();
    expect(job.remove).not.toHaveBeenCalled();
  });

  it('prepare returns already-queued for active jobs', async () => {
    const queue = {
      getJob: vi.fn(() => Promise.resolve(mockJob('active'))),
    };
    const result = await prepareBullFixedJobIdForAdd(queue, 'document-extract-x');
    expect(result).toBe('already-queued');
  });

  it('prepare removes failed job and returns add', async () => {
    const failed = mockJob('failed');
    const queue = {
      getJob: vi
        .fn()
        .mockResolvedValueOnce(failed)
        .mockResolvedValueOnce(null),
    };
    const result = await prepareBullFixedJobIdForAdd(queue, 'document-extract-x');
    expect(result).toBe('add');
    expect(failed.remove).toHaveBeenCalled();
  });

  it('assert throws when job missing', async () => {
    const queue = { getJob: vi.fn(() => Promise.resolve(null)) };
    await expect(assertBullFixedJobIdQueued(queue, 'j1')).rejects.toThrow(/missing/);
  });

  it('assert passes for waiting jobs', async () => {
    const queue = { getJob: vi.fn(() => Promise.resolve(mockJob('waiting'))) };
    await assertBullFixedJobIdQueued(queue, 'j1');
  });
});
