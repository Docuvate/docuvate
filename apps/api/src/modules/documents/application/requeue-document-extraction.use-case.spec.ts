// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { RequeueDocumentExtractionUseCase } from './requeue-document-extraction.use-case.js';

describe('RequeueDocumentExtractionUseCase', () => {
  it('queues extraction for a failed document', async () => {
    const queueExtraction = { execute: vi.fn().mockResolvedValue(undefined) };
    const documents = {
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-1',
        status: 'failed',
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: RequeueDocumentExtractionUseCase,
          useFactory: () =>
            // @ts-expect-error partial DocumentRepository stub for unit test
            new RequeueDocumentExtractionUseCase(documents, queueExtraction),
        },
      ],
    }).compile();
    const useCase = moduleRef.get(RequeueDocumentExtractionUseCase);

    await useCase.execute('doc-1', 'user-1');
    expect(queueExtraction.execute).toHaveBeenCalledWith('doc-1', 'user-1');
  });
});
