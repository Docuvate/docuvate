// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PaperlessImportQueueService } from './paperless-import.queue.js';

describe('PaperlessImportQueueService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not reject when resumePendingRuns fails', async () => {
    vi.spyOn(global, 'setTimeout').mockImplementation((handler: TimerHandler) => {
      if (typeof handler === 'function') {
        handler();
      }
      return 0 as unknown as NodeJS.Timeout;
    });
    const imports = {
      resumePendingRuns: vi.fn().mockRejectedValue(new Error('relation does not exist')),
    };
    const service = new PaperlessImportQueueService(imports as never, {} as never, {} as never);
    const resume = (
      service as unknown as { resumeInterruptedRuns: () => Promise<void> }
    ).resumeInterruptedRuns.bind(service);
    await expect(resume()).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });
});
