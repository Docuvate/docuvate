// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ConflictError } from '../../../shared/domain/errors.js';
import { PaperlessImportQueueService } from '../infrastructure/adapters/paperless/paperless-import.queue.js';
import { PaperlessImportRepository } from '../infrastructure/adapters/paperless/paperless-import.repository.js';
import { ConnectorRuntimeResolver } from './connector-runtime.resolver.js';
import { StartPaperlessImportUseCase } from './paperless-import.use-cases.js';

describe('StartPaperlessImportUseCase', () => {
  it('throws ConflictError when an import is already active', async () => {
    const runtime = {
      resolve: vi.fn().mockResolvedValue({ pluginId: 'paperless', credentials: {} }),
    };
    const imports = {
      findActiveRunForInstallation: vi.fn().mockResolvedValue({ id: 'run-active' }),
      getInstallationSettings: vi.fn(),
      getSyncWatermark: vi.fn(),
      createRun: vi.fn(),
    };
    const queue = { enqueue: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: StartPaperlessImportUseCase,
          useFactory: (
            resolver: ConnectorRuntimeResolver,
            repository: PaperlessImportRepository,
            queueService: PaperlessImportQueueService
          ) => new StartPaperlessImportUseCase(resolver, repository, queueService),
          inject: [ConnectorRuntimeResolver, PaperlessImportRepository, PaperlessImportQueueService],
        },
        { provide: ConnectorRuntimeResolver, useValue: runtime },
        { provide: PaperlessImportRepository, useValue: imports },
        { provide: PaperlessImportQueueService, useValue: queue },
      ],
    }).compile();
    const useCase = moduleRef.get(StartPaperlessImportUseCase);

    await expect(useCase.execute('user-1', 'install-1')).rejects.toBeInstanceOf(ConflictError);
    expect(imports.createRun).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
