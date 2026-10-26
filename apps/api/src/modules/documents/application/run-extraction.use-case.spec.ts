// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { type DocumentRepository, type ObjectStorage } from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { RunExtractionUseCase } from './run-extraction.use-case.js';

async function buildUseCase(options: {
  extractError?: Error;
  updateStatus: ReturnType<typeof vi.fn<DocumentRepository['updateStatus']>>;
}): Promise<RunExtractionUseCase> {
  const documents = createDocumentRepositoryStub({
    findById: vi.fn().mockResolvedValue({
      id: 'doc-1',
      userId: 'user-1',
      storageKey: 'k',
      mimeType: 'application/pdf',
      filename: 'f.pdf',
      title: 't',
      contentHash: 'hash',
    }),
    tryClaimForExtraction: vi.fn().mockResolvedValue('claimed'),
    updateStatus: options.updateStatus,
  });
  const storage: ObjectStorage = {
    putObject: vi.fn(),
    getObject: vi.fn().mockResolvedValue(Buffer.from('pdf')),
    deleteObject: vi.fn(),
  };
  const extraction = {
    extract: options.extractError
      ? vi.fn().mockRejectedValue(options.extractError)
      : vi.fn(),
  };
  const postOcr = { execute: vi.fn() };
  const scheduleDuplicates = { execute: vi.fn() };
  const resolveEngine = { execute: vi.fn().mockResolvedValue('default') };
  const syncSearch = { execute: vi.fn() };
  const persistRepresentation = { execute: vi.fn() };
  const densityRepo = { loadWorkerState: vi.fn().mockResolvedValue(null) };
  const taxonomy = { listTags: vi.fn().mockResolvedValue([]) };
  const featureFlags = { execute: vi.fn().mockResolvedValue({ exactAnswers: false }) };
  const persistFacts = { execute: vi.fn() };
  const promoteSuggestions = { execute: vi.fn() };
  const autoAccept = { execute: vi.fn() };

  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: RunExtractionUseCase,
        useFactory: () =>
          new RunExtractionUseCase(
            documents,
            storage,
            extraction,
            postOcr,
            scheduleDuplicates,
            resolveEngine,
            syncSearch,
            persistRepresentation,
            densityRepo,
            taxonomy,
            featureFlags,
            persistFacts,
            promoteSuggestions,
            autoAccept
          ),
      },
    ],
  }).compile();
  return moduleRef.get(RunExtractionUseCase);
}

describe('RunExtractionUseCase', () => {
  it('does not mark failed on worker 503 pressure', async () => {
    const updateStatus = vi.fn<DocumentRepository['updateStatus']>();
    const useCase = await buildUseCase({
      extractError: new Error('Worker extraction unavailable: 503'),
      updateStatus,
    });
    await expect(useCase.execute('doc-1')).rejects.toThrow('503');
    expect(updateStatus).not.toHaveBeenCalledWith('doc-1', 'failed', expect.anything());
  });
});
