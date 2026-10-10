// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { ExtractionQueueService } from '../../extraction/infrastructure/extraction-queue.service.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

async function buildUseCase(
  documents: {
    findByIdForUser: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  },
  queue: { enqueue: ReturnType<typeof vi.fn> }
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: QueueExtractionUseCase,
        useFactory: (documentRepository: DocumentRepository, extractionQueue: ExtractionQueueService) =>
          new QueueExtractionUseCase(documentRepository, extractionQueue),
        inject: [DOCUMENT_REPOSITORY, ExtractionQueueService],
      },
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: ExtractionQueueService, useValue: queue },
    ],
  }).compile();
  return moduleRef.get(QueueExtractionUseCase);
}

describe('QueueExtractionUseCase', () => {
  it('marks document queued after successful enqueue', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn(),
    };
    const queue = { enqueue: vi.fn(() => Promise.resolve()) };
    const useCase = await buildUseCase(documents, queue);

    await useCase.execute('d1', 'u1');

    expect(queue.enqueue).toHaveBeenCalledWith('d1', 'u1');
    expect(documents.updateStatus).toHaveBeenCalledWith('d1', 'queued');
  });

  it('marks document failed when enqueue exhausts retries', async () => {
    const documents = {
      findByIdForUser: vi.fn(() => Promise.resolve({ id: 'd1', userId: 'u1' })),
      updateStatus: vi.fn(),
    };
    const queue = {
      enqueue: vi.fn(() =>
        Promise.reject(
          new Error('document-extraction enqueue failed after 5 attempts: ECONNREFUSED')
        )
      ),
    };
    const useCase = await buildUseCase(documents, queue);

    await useCase.execute('d1', 'u1');

    expect(documents.updateStatus).toHaveBeenCalledWith('d1', 'failed');
    expect(documents.updateStatus).not.toHaveBeenCalledWith('d1', 'queued');
  });
});
