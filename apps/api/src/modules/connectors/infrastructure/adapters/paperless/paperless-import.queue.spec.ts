// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectorRuntimeResolver } from '../../../application/connector-runtime.resolver.js';
import { PaperlessImportExecutor } from './paperless-import.executor.js';
import { PaperlessImportQueueService } from './paperless-import.queue.js';
import { PaperlessImportRepository } from './paperless-import.repository.js';

describe('PaperlessImportQueueService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not reject when resumePendingRuns fails', async () => {
    vi.useFakeTimers();
    const imports = {
      resumePendingRuns: vi.fn().mockRejectedValue(new Error('relation does not exist')),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaperlessImportQueueService,
        { provide: PaperlessImportRepository, useValue: imports },
        { provide: PaperlessImportExecutor, useValue: {} },
        { provide: ConnectorRuntimeResolver, useValue: {} },
      ],
    }).compile();
    const service = moduleRef.get(PaperlessImportQueueService);

    const pending = service.resumeInterruptedRuns();
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBeUndefined();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
