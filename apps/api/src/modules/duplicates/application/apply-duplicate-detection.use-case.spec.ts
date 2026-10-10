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
import { ApplyDuplicateDetectionUseCase } from './apply-duplicate-detection.use-case.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

describe('ApplyDuplicateDetectionUseCase', () => {
  it('still links hash-identical documents regardless of year metadata', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'JA 2025.pdf',
        title: 'JA 2025',
        extraction: { text: 'Jahresabschluss 2025', fields: [] },
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

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LinkDuplicatePairUseCase,
          useFactory: (
            stackRepository: DuplicateStackRepository,
            duplicateRepository: DuplicateRepository
          ) => new LinkDuplicatePairUseCase(stackRepository, duplicateRepository),
          inject: [DUPLICATE_STACK_REPOSITORY, DUPLICATE_REPOSITORY],
        },
        {
          provide: ApplyDuplicateDetectionUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            duplicateRepository: DuplicateRepository,
            embeddingRepository: LabelEmbeddingRepository,
            linkDuplicatePair: LinkDuplicatePairUseCase
          ) =>
            new ApplyDuplicateDetectionUseCase(
              documentRepository,
              duplicateRepository,
              embeddingRepository,
              linkDuplicatePair
            ),
          inject: [
            DOCUMENT_REPOSITORY,
            DUPLICATE_REPOSITORY,
            LABEL_EMBEDDING_REPOSITORY,
            LinkDuplicatePairUseCase,
          ],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        { provide: DUPLICATE_REPOSITORY, useValue: duplicates },
        {
          provide: LABEL_EMBEDDING_REPOSITORY,
          useValue: embeddings,
        },
        { provide: DUPLICATE_STACK_REPOSITORY, useValue: stacks },
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

  it('does not upsert embedding candidates blocked by reporting-year gates', async () => {
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: '774128 - JA Auswertungen 2025.pdf',
        title: 'JA Auswertungen 2025',
        extraction: {
          text: 'JAHRESABSCHLUSS zum 31. Dezember 2025',
          fields: [],
          blocks: [{ page: 12, x: 0, y: 0, width: 1, height: 1, text: 'x' }],
        },
      }),
    });
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue([]),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([
        {
          documentId: 'doc-2024',
          embedding: [1, 0],
          filename: '655536 - JA Auswertungen HR 2024.pdf',
          title: 'JA Auswertungen HR 2024',
          documentDate: null,
          extractedText: 'Bilanz zum 31.12.2024',
          extractedFields: {
            blocks: [{ page: 11, x: 0, y: 0, width: 1, height: 1, text: 'y' }],
          },
        },
      ]),
      isPairDismissed: vi.fn().mockResolvedValue(false),
    };
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([0.99, 0.01]),
    };
    const linkPair = vi.fn();
    const stacks = createDuplicateStackRepositoryStub({ linkPair });

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LinkDuplicatePairUseCase,
          useFactory: (
            stackRepository: DuplicateStackRepository,
            duplicateRepository: DuplicateRepository
          ) => new LinkDuplicatePairUseCase(stackRepository, duplicateRepository),
          inject: [DUPLICATE_STACK_REPOSITORY, DUPLICATE_REPOSITORY],
        },
        {
          provide: ApplyDuplicateDetectionUseCase,
          useFactory: (
            documentRepository: DocumentRepository,
            duplicateRepository: DuplicateRepository,
            embeddingRepository: LabelEmbeddingRepository,
            linkDuplicatePair: LinkDuplicatePairUseCase
          ) =>
            new ApplyDuplicateDetectionUseCase(
              documentRepository,
              duplicateRepository,
              embeddingRepository,
              linkDuplicatePair
            ),
          inject: [
            DOCUMENT_REPOSITORY,
            DUPLICATE_REPOSITORY,
            LABEL_EMBEDDING_REPOSITORY,
            LinkDuplicatePairUseCase,
          ],
        },
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        { provide: DUPLICATE_REPOSITORY, useValue: duplicates },
        {
          provide: LABEL_EMBEDDING_REPOSITORY,
          useValue: embeddings,
        },
        { provide: DUPLICATE_STACK_REPOSITORY, useValue: stacks },
      ],
    }).compile();
    const useCase = moduleRef.get(ApplyDuplicateDetectionUseCase);

    await useCase.execute('doc-new', 'user-1', null);

    expect(duplicates.upsertCandidate).not.toHaveBeenCalled();
    expect(linkPair).not.toHaveBeenCalled();
  });
});
