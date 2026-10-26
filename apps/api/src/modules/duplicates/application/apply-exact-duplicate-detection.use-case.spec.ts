// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createDuplicateRepositoryStub } from '../../../test-support/duplicate-repository.stub.js';
import { hashNormalizedExtractedText } from '../domain/normalized-extracted-text-hash.js';
import { ApplyExactDuplicateDetectionUseCase } from './apply-exact-duplicate-detection.use-case.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

describe('ApplyExactDuplicateDetectionUseCase', () => {
  it('links byte-hash and normalized-text-hash matches', async () => {
    const text = 'Invoice   TOTAL\n10.00';
    const textHash = hashNormalizedExtractedText(text);
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'a.pdf',
        title: 'a',
        extraction: { text, fields: [] },
      }),
      setExtractedTextHash: vi.fn(),
    });
    const duplicates = createDuplicateRepositoryStub({
      findDocumentIdsByHash: vi.fn().mockResolvedValue(['doc-bytes']),
      findDocumentIdsByExtractedTextHash: vi.fn().mockResolvedValue(['doc-text']),
    });
    const linkDuplicatePair = { execute: vi.fn().mockResolvedValue(undefined) };
    const useCase = new ApplyExactDuplicateDetectionUseCase(
      documents,
      duplicates,
      linkDuplicatePair as LinkDuplicatePairUseCase
    );
    await useCase.execute('doc-new', 'user-1', 'sha-bytes');

    expect(duplicates.findDocumentIdsByHash).toHaveBeenCalled();
    expect(documents.setExtractedTextHash).toHaveBeenCalledWith('doc-new', textHash);
    expect(duplicates.findDocumentIdsByExtractedTextHash).toHaveBeenCalledWith(
      'user-1',
      textHash,
      'doc-new'
    );
    expect(linkDuplicatePair.execute).toHaveBeenCalledTimes(2);
  });
});
