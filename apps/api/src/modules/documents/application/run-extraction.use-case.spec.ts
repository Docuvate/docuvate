// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_REPOSITORY,
  EXTRACTION_PORT,
  OBJECT_STORAGE,
  TAXONOMY_REPOSITORY,
  type DocumentRepository,
  type ExtractionPort,
  type ObjectStorage,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createExtractionPortStub } from '../../../test-support/extraction-port.stub.js';
import { createTaxonomyRepositoryStub } from '../../../test-support/taxonomy-repository.stub.js';
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

vi.mock('../../document-pipeline/application/run-document-post-ocr-pipeline.use-case.js', () => ({
  RunDocumentPostOcrPipelineUseCase: class RunDocumentPostOcrPipelineUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
    listModuleDescriptors = vi.fn().mockReturnValue([]);
  },
}));

vi.mock('../../duplicates/application/schedule-duplicate-detection.use-case.js', () => ({
  ScheduleDuplicateDetectionUseCase: class ScheduleDuplicateDetectionUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../settings/application/settings.use-cases.js', () => ({
  ResolveUserExtractorEngineUseCase: class ResolveUserExtractorEngineUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue('default');
  },
}));

vi.mock('../../search/application/sync-document-search-index.use-case.js', () => ({
  SyncDocumentSearchIndexUseCase: class SyncDocumentSearchIndexUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../representation/application/persist-document-representation.use-case.js', () => ({
  PersistDocumentRepresentationUseCase: class PersistDocumentRepresentationUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../labels/infrastructure/pg-embedding-density.repository.js', () => ({
  PgEmbeddingDensityRepository: class PgEmbeddingDensityRepository {
    constructor(..._args: unknown[]) {}

    loadWorkerState = vi.fn().mockResolvedValue(null);
  },
}));

vi.mock('../../feature-flags/application/resolve-feature-flags.use-case.js', () => ({
  ResolveFeatureFlagsUseCase: class ResolveFeatureFlagsUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue({ exactAnswers: false });
    assertEnabled = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../exact-facts/application/persist-document-facts.use-case.js', () => ({
  PersistDocumentFactsUseCase: class PersistDocumentFactsUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('./document-review/promote-extraction-suggestions.use-case.js', () => ({
  PromoteHighConfidenceExtractionSuggestionsUseCase:
    class PromoteHighConfidenceExtractionSuggestionsUseCase {
      constructor(..._args: unknown[]) {}

      execute = vi.fn().mockResolvedValue(undefined);
    },
}));

vi.mock('./document-review/auto-accept-calibrated-review.use-case.js', () => ({
  AutoAcceptCalibratedReviewUseCase: class AutoAcceptCalibratedReviewUseCase {
    constructor(..._args: unknown[]) {}

    execute = vi.fn().mockResolvedValue(undefined);
  },
}));

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
  const taxonomy = createTaxonomyRepositoryStub({
    listTags: vi.fn().mockResolvedValue([]),
  });

  const moduleRef = await Test.createTestingModule({
    providers: [
      RunDocumentPostOcrPipelineUseCase,
      ScheduleDuplicateDetectionUseCase,
      ResolveUserExtractorEngineUseCase,
      SyncDocumentSearchIndexUseCase,
      PersistDocumentRepresentationUseCase,
      PgEmbeddingDensityRepository,
      ResolveFeatureFlagsUseCase,
      PersistDocumentFactsUseCase,
      PromoteHighConfidenceExtractionSuggestionsUseCase,
      AutoAcceptCalibratedReviewUseCase,
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: OBJECT_STORAGE, useValue: storage },
      { provide: EXTRACTION_PORT, useValue: extraction },
      { provide: TAXONOMY_REPOSITORY, useValue: taxonomy },
      {
        provide: RunExtractionUseCase,
        useFactory: (
          documentRepository: DocumentRepository,
          objectStorage: ObjectStorage,
          extractionPort: ExtractionPort,
          postOcr: RunDocumentPostOcrPipelineUseCase,
          scheduleDuplicates: ScheduleDuplicateDetectionUseCase,
          resolveEngine: ResolveUserExtractorEngineUseCase,
          syncSearch: SyncDocumentSearchIndexUseCase,
          persistRepresentation: PersistDocumentRepresentationUseCase,
          densityRepo: PgEmbeddingDensityRepository,
          taxonomyRepository: TaxonomyRepository,
          featureFlags: ResolveFeatureFlagsUseCase,
          persistFacts: PersistDocumentFactsUseCase,
          promoteSuggestions: PromoteHighConfidenceExtractionSuggestionsUseCase,
          autoAccept: AutoAcceptCalibratedReviewUseCase
        ) =>
          new RunExtractionUseCase(
            documentRepository,
            objectStorage,
            extractionPort,
            postOcr,
            scheduleDuplicates,
            resolveEngine,
            syncSearch,
            persistRepresentation,
            densityRepo,
            taxonomyRepository,
            featureFlags,
            persistFacts,
            promoteSuggestions,
            autoAccept
          ),
        inject: [
          DOCUMENT_REPOSITORY,
          OBJECT_STORAGE,
          EXTRACTION_PORT,
          RunDocumentPostOcrPipelineUseCase,
          ScheduleDuplicateDetectionUseCase,
          ResolveUserExtractorEngineUseCase,
          SyncDocumentSearchIndexUseCase,
          PersistDocumentRepresentationUseCase,
          PgEmbeddingDensityRepository,
          TAXONOMY_REPOSITORY,
          ResolveFeatureFlagsUseCase,
          PersistDocumentFactsUseCase,
          PromoteHighConfidenceExtractionSuggestionsUseCase,
          AutoAcceptCalibratedReviewUseCase,
        ],
      },
    ],
  }).compile();
  return moduleRef.get(RunExtractionUseCase);
}

describe('RunExtractionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
