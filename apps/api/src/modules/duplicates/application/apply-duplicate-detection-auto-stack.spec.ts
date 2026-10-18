// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createDuplicateRepositoryStub } from '../../../test-support/duplicate-repository.stub.js';
import { createDuplicateStackRepositoryStub } from '../../../test-support/duplicate-stack-repository.stub.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import { HttpSmartDuplicatesAdapter } from '../infrastructure/http-smart-duplicates.adapter.js';
import { ApplyDuplicateDetectionUseCase } from './apply-duplicate-detection.use-case.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

const defaultFlags = {
  layoutReconstructionCompare: false,
  sourceConnectors: false,
  experimentalResearchModels: false,
  smartDuplicates: false,
};

describe('ApplyDuplicateDetectionUseCase auto_stack', () => {
  it('auto-stacks embedding matches when classifier returns auto_stack', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'a.pdf',
        title: 'a',
        extraction: { text: 'Invoice 1 total 10.00', fields: [] },
      }),
    });
    const duplicates = createDuplicateRepositoryStub({
      findDocumentIdsByHash: vi.fn().mockResolvedValue([]),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([
        {
          documentId: 'doc-old',
          embedding: [1, 0],
          filename: 'b.pdf',
          title: 'b',
          documentDate: null,
          extractedText: 'Invoice 1 total 10.00',
          extractedFields: null,
        },
      ]),
      isPairDismissed: vi.fn().mockResolvedValue(false),
    });
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([1, 0]),
    };
    const linkPair = vi.fn();
    const stacks = createDuplicateStackRepositoryStub({ linkPair });
    const classifier = {
      evaluate: vi.fn().mockResolvedValue({ decision: 'auto_stack', probability: 0.99 }),
    };
    const resolveFeatureFlags = { execute: vi.fn().mockResolvedValue(defaultFlags) };
    const smartDuplicates = { detectCandidates: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ApplyDuplicateDetectionUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            duplicateRepository: DuplicateRepository,
            embeddingRepository: LabelEmbeddingRepository,
            duplicateClassifier: DuplicateClassifierService,
            linkDuplicatePair: LinkDuplicatePairUseCase,
            featureFlags: ResolveFeatureFlagsUseCase,
            smartDuplicateAdapter: HttpSmartDuplicatesAdapter
          ) =>
            new ApplyDuplicateDetectionUseCase(
              documentRepository,
              duplicateRepository,
              embeddingRepository,
              duplicateClassifier,
              linkDuplicatePair,
              featureFlags,
              smartDuplicateAdapter
            ),
          inject: [
            DOCUMENT_REPOSITORY,
            DUPLICATE_REPOSITORY,
            LABEL_EMBEDDING_REPOSITORY,
            DuplicateClassifierService,
            LinkDuplicatePairUseCase,
            ResolveFeatureFlagsUseCase,
            HttpSmartDuplicatesAdapter,
          ],
        },
        {
          provide: LinkDuplicatePairUseCase,
          useFactory: (
            stackRepository: DuplicateStackRepository,
            duplicateRepository: DuplicateRepository
          ) => new LinkDuplicatePairUseCase(stackRepository, duplicateRepository),
          inject: [DUPLICATE_STACK_REPOSITORY, DUPLICATE_REPOSITORY],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        { provide: DUPLICATE_REPOSITORY, useValue: duplicates },
        { provide: LABEL_EMBEDDING_REPOSITORY, useValue: embeddings },
        { provide: DUPLICATE_STACK_REPOSITORY, useValue: stacks },
        { provide: DuplicateClassifierService, useValue: classifier },
        { provide: ResolveFeatureFlagsUseCase, useValue: resolveFeatureFlags },
        { provide: HttpSmartDuplicatesAdapter, useValue: smartDuplicates },
      ],
    }).compile();
    const useCase = moduleRef.get(ApplyDuplicateDetectionUseCase);

    await useCase.execute('doc-new', 'user-1', null);

    expect(duplicates.upsertCandidate).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
    expect(linkPair).toHaveBeenCalledWith('user-1', 'doc-new', 'doc-old');
  });
});
