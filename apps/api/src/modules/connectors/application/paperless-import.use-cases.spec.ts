// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ConflictError, ValidationError } from '../../../shared/domain/errors.js';
import { PaperlessImportQueueService } from '../infrastructure/adapters/paperless/paperless-import.queue.js';
import { PaperlessImportRepository } from '../infrastructure/adapters/paperless/paperless-import.repository.js';
import { ConnectorRuntimeResolver } from './connector-runtime.resolver.js';
import {
  RetryFailedPaperlessImportUseCase,
  StartPaperlessImportUseCase,
} from './paperless-import.use-cases.js';

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

describe('RetryFailedPaperlessImportUseCase', () => {
  it('enqueues a retry run with failed document ids from the latest run', async () => {
    const runtime = {
      resolve: vi.fn().mockResolvedValue({ pluginId: 'paperless', credentials: {} }),
    };
    const imports = {
      findActiveRunForInstallation: vi.fn().mockResolvedValue(null),
      findLatestRunForInstallation: vi.fn().mockResolvedValue({ id: 'run-latest' }),
      listFailedSourceDocumentIdsForRun: vi.fn().mockResolvedValue(['170', '171']),
      getInstallationSettings: vi.fn().mockResolvedValue({
        keepOcrText: true,
        rerunOcr: false,
        includeArchivedPdf: false,
      }),
      createRun: vi.fn().mockResolvedValue({ id: 'run-retry' }),
    };
    const queue = { enqueue: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RetryFailedPaperlessImportUseCase,
          useFactory: (
            resolver: ConnectorRuntimeResolver,
            repository: PaperlessImportRepository,
            queueService: PaperlessImportQueueService
          ) => new RetryFailedPaperlessImportUseCase(resolver, repository, queueService),
          inject: [ConnectorRuntimeResolver, PaperlessImportRepository, PaperlessImportQueueService],
        },
        { provide: ConnectorRuntimeResolver, useValue: runtime },
        { provide: PaperlessImportRepository, useValue: imports },
        { provide: PaperlessImportQueueService, useValue: queue },
      ],
    }).compile();
    const useCase = moduleRef.get(RetryFailedPaperlessImportUseCase);

    const run = await useCase.execute('user-1', 'install-1');
    expect(run.id).toBe('run-retry');
    expect(imports.createRun).toHaveBeenCalledWith({
      installationId: 'install-1',
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
      incrementalModifiedGt: null,
      retrySourceDocumentIds: ['170', '171'],
    });
    expect(queue.enqueue).toHaveBeenCalledWith('run-retry', 'user-1');
  });

  it('throws when the latest run has no failed documents', async () => {
    const runtime = {
      resolve: vi.fn().mockResolvedValue({ pluginId: 'paperless', credentials: {} }),
    };
    const imports = {
      findActiveRunForInstallation: vi.fn().mockResolvedValue(null),
      findLatestRunForInstallation: vi.fn().mockResolvedValue({ id: 'run-latest' }),
      listFailedSourceDocumentIdsForRun: vi.fn().mockResolvedValue([]),
      getInstallationSettings: vi.fn(),
      createRun: vi.fn(),
    };
    const queue = { enqueue: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RetryFailedPaperlessImportUseCase,
          useFactory: (
            resolver: ConnectorRuntimeResolver,
            repository: PaperlessImportRepository,
            queueService: PaperlessImportQueueService
          ) => new RetryFailedPaperlessImportUseCase(resolver, repository, queueService),
          inject: [ConnectorRuntimeResolver, PaperlessImportRepository, PaperlessImportQueueService],
        },
        { provide: ConnectorRuntimeResolver, useValue: runtime },
        { provide: PaperlessImportRepository, useValue: imports },
        { provide: PaperlessImportQueueService, useValue: queue },
      ],
    }).compile();
    const useCase = moduleRef.get(RetryFailedPaperlessImportUseCase);

    await expect(useCase.execute('user-1', 'install-1')).rejects.toBeInstanceOf(ValidationError);
    expect(imports.createRun).not.toHaveBeenCalled();
  });
});
