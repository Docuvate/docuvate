// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  EXTRACTION_PORT,
  OBJECT_STORAGE,
  TAXONOMY_REPOSITORY,
} from '../../../shared/domain/ports.js';
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
  const documents = {
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
    setPreviewStorageKey: vi.fn(),
    saveExtraction: vi.fn(),
    saveExtractionImages: vi.fn(),
    setHeuristicFieldExtractorVersion: vi.fn(),
  };
  const extraction = {
    extract: options.extractError
      ? vi.fn().mockRejectedValue(options.extractError)
      : vi.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      RunExtractionUseCase,
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: OBJECT_STORAGE, useValue: { getObject: vi.fn().mockResolvedValue(Buffer.from('pdf')) } },
      { provide: EXTRACTION_PORT, useValue: extraction },
      { provide: RunDocumentPostOcrPipelineUseCase, useValue: { execute: vi.fn() } },
      { provide: ScheduleDuplicateDetectionUseCase, useValue: { execute: vi.fn() } },
      {
        provide: ResolveUserExtractorEngineUseCase,
        useValue: { execute: vi.fn().mockResolvedValue('default') },
      },
      { provide: SyncDocumentSearchIndexUseCase, useValue: { execute: vi.fn() } },
      { provide: PersistDocumentRepresentationUseCase, useValue: { execute: vi.fn() } },
      {
        provide: PgEmbeddingDensityRepository,
        useValue: { loadWorkerState: vi.fn().mockResolvedValue(null) },
      },
      { provide: TAXONOMY_REPOSITORY, useValue: { listTags: vi.fn().mockResolvedValue([]) } },
      {
        provide: ResolveFeatureFlagsUseCase,
        useValue: { execute: vi.fn().mockResolvedValue({ exactAnswers: false }) },
      },
      { provide: PersistDocumentFactsUseCase, useValue: { execute: vi.fn() } },
      {
        provide: PromoteHighConfidenceExtractionSuggestionsUseCase,
        useValue: { execute: vi.fn() },
      },
      { provide: AutoAcceptCalibratedReviewUseCase, useValue: { execute: vi.fn() } },
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
