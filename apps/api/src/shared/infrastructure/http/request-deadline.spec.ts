// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { runWithRequestDeadline } from './request-deadline.js';

interface DeadlineProbe {
  items: [];
  state: 'ready' | 'warming';
}

describe('runWithRequestDeadline', () => {
  it('returns the handler result when it finishes before the deadline', async () => {
    const result = await runWithRequestDeadline<DeadlineProbe>(
      200,
      () => Promise.resolve({ items: [], state: 'ready' }),
      () => ({ items: [], state: 'warming' })
    );
    expect(result.state).toBe('ready');
  });

  it('returns the timeout fallback and aborts the signal when the deadline elapses', async () => {
    vi.useFakeTimers();
    let sawAbort = false;
    const slow = runWithRequestDeadline<DeadlineProbe>(
      50,
      async (signal) => {
        await new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => {
            sawAbort = true;
            resolve();
          });
        });
        return { items: [], state: 'ready' };
      },
      () => ({ items: [], state: 'warming' })
    );
    await vi.advanceTimersByTimeAsync(50);
    const result = await slow;
    expect(result.state).toBe('warming');
    expect(sawAbort).toBe(true);
    vi.useRealTimers();
  });
});
