// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_REPOSITORY,
  EXTRACTION_PORT,
  OBJECT_STORAGE,
  TAXONOMY_REPOSITORY,
  type DocumentRepository,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createExtractionPortStub } from '../../../test-support/extraction-port.stub.js';
import { RunDocumentPostOcrPipelineUseCase } from '../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js';
import { ScheduleDuplicateDetectionUseCase } from '../../duplicates/application/schedule-duplicate-detection.use-case.js';
import { PersistDocumentFactsUseCase } from '../../exact-facts/application/persist-document-facts.use-case.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { PgEmbeddingDensityRepository } from '../../labels/infrastructure/pg-embedding-density.repository.js';
import { PersistDocumentRepresentationUseCase } from '../../representation/application/persist-document-representation.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';
import { ResolveUserExtractorEngineUseCase } from '../../settings/application/settings.use-cases.js';
import { AutoAcceptCalibratedReviewUseCase } from './document-review/auto-accept-calibrated-review.use-case.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from './document-review/promote-extraction-suggestions.use-case.js';
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
  const extraction = createExtractionPortStub(
    options.extractError
      ? { extract: vi.fn().mockRejectedValue(options.extractError) }
      : {}
  );
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
      RunExtractionUseCase,
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: OBJECT_STORAGE, useValue: storage },
      { provide: EXTRACTION_PORT, useValue: extraction },
      { provide: RunDocumentPostOcrPipelineUseCase, useValue: postOcr },
      { provide: ScheduleDuplicateDetectionUseCase, useValue: scheduleDuplicates },
      { provide: ResolveUserExtractorEngineUseCase, useValue: resolveEngine },
      { provide: SyncDocumentSearchIndexUseCase, useValue: syncSearch },
      { provide: PersistDocumentRepresentationUseCase, useValue: persistRepresentation },
      { provide: PgEmbeddingDensityRepository, useValue: densityRepo },
      { provide: TAXONOMY_REPOSITORY, useValue: taxonomy },
      { provide: ResolveFeatureFlagsUseCase, useValue: featureFlags },
      { provide: PersistDocumentFactsUseCase, useValue: persistFacts },
      { provide: PromoteHighConfidenceExtractionSuggestionsUseCase, useValue: promoteSuggestions },
      { provide: AutoAcceptCalibratedReviewUseCase, useValue: autoAccept },
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
