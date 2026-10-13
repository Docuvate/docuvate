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

describe('ApplyDuplicateDetectionUseCase', () => {
  it('still links hash-identical documents regardless of classifier', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'file.pdf',
        title: 'file',
        extraction: { text: 'content', fields: [] },
      }),
    });
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue(['doc-old']),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([]),
      isPairDismissed: vi.fn().mockResolvedValue(false),
    };
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([1, 0]),
    };
    const linkPair = vi.fn();
    const stacks = createDuplicateStackRepositoryStub({ linkPair });
    const classifier = { evaluate: vi.fn() };
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

    await useCase.execute('doc-new', 'user-1', 'same-hash');

    expect(duplicates.upsertCandidate).toHaveBeenCalledWith(
      'user-1',
      'doc-new',
      'doc-old',
      1,
      'hash'
    );
    expect(linkPair).toHaveBeenCalledWith('user-1', 'doc-new', 'doc-old');
  });

  it('suggests without linking when classifier returns suggest', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'a.pdf',
        title: 'a',
        extraction: { text: 'Invoice 1 total 10.00', fields: [] },
      }),
    });
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue([]),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([
        {
          documentId: 'doc-old',
          embedding: [1, 0],
          filename: 'b.pdf',
          title: 'b',
          documentDate: null,
          extractedText: 'Invoice 2 total 20.00',
          extractedFields: null,
        },
      ]),
      isPairDismissed: vi.fn().mockResolvedValue(false),
    };
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([1, 0]),
    };
    const linkPair = vi.fn();
    const stacks = createDuplicateStackRepositoryStub({ linkPair });
    const classifier = {
      evaluate: vi.fn().mockResolvedValue({ decision: 'suggest', probability: 0.6 }),
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

    expect(duplicates.upsertCandidate).toHaveBeenCalled();
    expect(linkPair).not.toHaveBeenCalled();
  });

  it('records smart duplicate hints without auto-stacking when flag is enabled', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'a.pdf',
        title: 'Receipt A',
        documentDate: new Date('2024-03-15'),
        correspondent: null,
        extraction: {
          text: 'NORDWIND ENERGIE GMBH\nRechnung\nGesamtbetrag EUR 199.00',
          fields: [],
        },
      }),
    });
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue([]),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn(),
      listSmartDuplicatePeers: vi.fn().mockResolvedValue([
        {
          documentId: 'doc-old',
          filename: 'b.pdf',
          title: 'Receipt B',
          extractedText: 'NORDWIND ENERGIE GMBH\nRechnung\nGesamtbetrag EUR 199.OO',
        },
      ]),
      isPairDismissed: vi.fn().mockResolvedValue(false),
    };
    const embeddings = { getDocumentEmbedding: vi.fn() };
    const linkPair = vi.fn();
    const stacks = createDuplicateStackRepositoryStub({ linkPair });
    const classifier = { evaluate: vi.fn() };
    const smartDuplicates = {
      detectCandidates: vi.fn().mockResolvedValue([{ documentId: 'doc-old', similarity: 0.91 }]),
    };
    const resolveFeatureFlags = {
      execute: vi.fn().mockResolvedValue({ ...defaultFlags, smartDuplicates: true }),
    };

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

    expect(smartDuplicates.detectCandidates).toHaveBeenCalled();
    expect(duplicates.upsertCandidate).toHaveBeenCalledWith(
      'user-1',
      'doc-new',
      'doc-old',
      0.91,
      'smart'
    );
    expect(linkPair).not.toHaveBeenCalled();
    expect(embeddings.getDocumentEmbedding).not.toHaveBeenCalled();
  });
});
