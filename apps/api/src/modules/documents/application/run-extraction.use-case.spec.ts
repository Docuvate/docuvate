// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  type DocumentRepository,
  type ObjectStorage,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import {
  createClassStub,
  createExecuteUseCaseStub,
} from '../../../test-support/execute-use-case.stub.js';
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
  const postOcr = createExecuteUseCaseStub<RunDocumentPostOcrPipelineUseCase>();
  const scheduleDuplicates = createExecuteUseCaseStub<ScheduleDuplicateDetectionUseCase>();
  const resolveEngine = createExecuteUseCaseStub<ResolveUserExtractorEngineUseCase>({
    execute: vi.fn().mockResolvedValue('default'),
  });
  const syncSearch = createExecuteUseCaseStub<SyncDocumentSearchIndexUseCase>();
  const persistRepresentation = createExecuteUseCaseStub<PersistDocumentRepresentationUseCase>();
  const densityRepo = createClassStub<PgEmbeddingDensityRepository>({
    loadWorkerState: vi.fn().mockResolvedValue(null),
  });
  const taxonomy = createClassStub<TaxonomyRepository>({
    listTags: vi.fn().mockResolvedValue([]),
  });
  const featureFlags = createExecuteUseCaseStub<ResolveFeatureFlagsUseCase>({
    execute: vi.fn().mockResolvedValue({ exactAnswers: false }),
  });
  const persistFacts = createExecuteUseCaseStub<PersistDocumentFactsUseCase>();
  const promoteSuggestions =
    createExecuteUseCaseStub<PromoteHighConfidenceExtractionSuggestionsUseCase>();
  const autoAccept = createExecuteUseCaseStub<AutoAcceptCalibratedReviewUseCase>();

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
