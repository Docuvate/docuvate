// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  CLOCK,
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  FOLDER_REPOSITORY,
  type FolderRepository,
  ID_GENERATOR,
  MAPPE_REPOSITORY,
  type MappeRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';
import { isPlainTextUploadMime, UploadDocumentUseCase } from './upload-document.use-case.js';

async function buildUseCase(overrides?: {
  create?: ReturnType<typeof vi.fn>;
  findMappe?: ReturnType<typeof vi.fn>;
}) {
  const created: { mappeId?: string | null; folderId?: string | null } = {};
  const documents = createDocumentRepositoryStub({
    create:
      overrides?.create ??
      vi.fn((doc: typeof created) => {
        Object.assign(created, doc);
        return Promise.resolve({ ...doc, id: 'doc-1', tags: [] });
      }),
    setContentHash: vi.fn(),
    findByIdForUser: vi.fn(() =>
      Promise.resolve({
        id: 'doc-1',
        userId: 'user-1',
        filename: 'a.pdf',
        title: 'a',
        mimeType: 'application/pdf',
        storageKey: 'k',
        status: 'ready',
        mappeId: 'm1',
        folderId: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies DocumentEntity)
    ),
  });

  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: UploadDocumentUseCase,
        useFactory: (
          documentRepository: DocumentRepository,
          taxonomy: TaxonomyRepository,
          folders: FolderRepository,
          mappen: MappeRepository,
          storage: ObjectStorage,
          ids: { generate: () => string },
          clock: { now: () => Date },
          queueExtraction: QueueExtractionUseCase,
          applyDuplicateDetection: ApplyDuplicateDetectionUseCase,
          syncSearchIndex: SyncDocumentSearchIndexUseCase
        ) =>
          new UploadDocumentUseCase(
            documentRepository,
            taxonomy,
            folders,
            mappen,
            storage,
            ids,
            clock,
            queueExtraction,
            applyDuplicateDetection,
            syncSearchIndex
          ),
        inject: [
          DOCUMENT_REPOSITORY,
          TAXONOMY_REPOSITORY,
          FOLDER_REPOSITORY,
          MAPPE_REPOSITORY,
          OBJECT_STORAGE,
          ID_GENERATOR,
          CLOCK,
          QueueExtractionUseCase,
          ApplyDuplicateDetectionUseCase,
          SyncDocumentSearchIndexUseCase,
        ],
      },
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      {
        provide: TAXONOMY_REPOSITORY,
        useValue: {
          ensureInboxTag: vi.fn(() => Promise.resolve({ id: 't1' })),
        },
      },
      {
        provide: FOLDER_REPOSITORY,
        useValue: { findByIdForUser: vi.fn() },
      },
      {
        provide: MAPPE_REPOSITORY,
        useValue: {
          findByIdForUser: overrides?.findMappe ?? vi.fn(() => Promise.resolve({ id: 'm1' })),
        },
      },
      {
        provide: OBJECT_STORAGE,
        useValue: { putObject: vi.fn() },
      },
      { provide: ID_GENERATOR, useValue: { generate: () => 'doc-1' } },
      { provide: CLOCK, useValue: { now: () => new Date('2026-01-01') } },
      {
        provide: QueueExtractionUseCase,
        useValue: { execute: vi.fn() },
      },
      {
        provide: ApplyDuplicateDetectionUseCase,
        useValue: { execute: vi.fn() },
      },
      {
        provide: SyncDocumentSearchIndexUseCase,
        useValue: { execute: vi.fn() },
      },
    ],
  }).compile();

  const useCase = moduleRef.get(UploadDocumentUseCase);
  return { useCase, created, documents };
}

describe('UploadDocumentUseCase placement', () => {
  it('stores mappeId on create when uploading into an empty mappe', async () => {
    const { useCase, created } = await buildUseCase();
    await useCase.execute({
      userId: 'u1',
      filename: 'a.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF'),
      mappeId: 'm1',
    });
    expect(created.mappeId).toBe('m1');
    expect(created.folderId).toBeNull();
  });

  it('rejects folder and mappe together', async () => {
    const { useCase } = await buildUseCase();
    await expect(
      useCase.execute({
        userId: 'u1',
        filename: 'a.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('x'),
        folderId: 'f1',
        mappeId: 'm1',
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('isPlainTextUploadMime', () => {
  it('accepts text/plain', () => {
    expect(isPlainTextUploadMime('text/plain')).toBe(true);
    expect(isPlainTextUploadMime('text/plain; charset=utf-8')).toBe(true);
  });

  it('rejects other types', () => {
    expect(isPlainTextUploadMime('application/pdf')).toBe(false);
    expect(isPlainTextUploadMime('text/html')).toBe(false);
  });
});
