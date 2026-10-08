import { describe, expect, it, vi } from 'vitest';
import { enqueueBullJobWithRetry } from './bullmq-enqueue-retry.js';

describe('enqueueBullJobWithRetry', () => {
  it('retries until add succeeds', async () => {
    const add = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(undefined);

    await enqueueBullJobWithRetry(add, { maxAttempts: 5, initialDelayMs: 1, label: 'test-queue' });

    expect(add).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const add = vi.fn().mockRejectedValue(new Error('valkey down'));

    await expect(
      enqueueBullJobWithRetry(add, { maxAttempts: 3, initialDelayMs: 1, label: 'document-extraction' })
    ).rejects.toThrow(/document-extraction enqueue failed after 3 attempts/);

    expect(add).toHaveBeenCalledTimes(3);
  });
});
