// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
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
    const useCase = new RequeueDocumentExtractionUseCase(documents as never, queueExtraction as never);
    await useCase.execute('doc-1', 'user-1');
    expect(queueExtraction.execute).toHaveBeenCalledWith('doc-1', 'user-1');
  });
});
