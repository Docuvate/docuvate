// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createDuplicateRepositoryStub } from '../../../test-support/duplicate-repository.stub.js';
import { createDuplicateStackRepositoryStub } from '../../../test-support/duplicate-stack-repository.stub.js';
import { hashNormalizedExtractedText } from '../domain/normalized-extracted-text-hash.js';
import { ApplyExactDuplicateDetectionUseCase } from './apply-exact-duplicate-detection.use-case.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

describe('ApplyExactDuplicateDetectionUseCase', () => {
  it('links byte-hash and normalized-text-hash matches', async () => {
    const text = 'Invoice   TOTAL\n10.00';
    const textHash = hashNormalizedExtractedText(text);
    const setExtractedTextHash = vi.fn();
    const findDocumentIdsByHash = vi.fn().mockResolvedValue(['doc-bytes']);
    const findDocumentIdsByExtractedTextHash = vi.fn().mockResolvedValue(['doc-text']);
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'a.pdf',
        title: 'a',
        extraction: { text, fields: [] },
      }),
      setExtractedTextHash,
    });
    const duplicates = createDuplicateRepositoryStub({
      findDocumentIdsByHash,
      findDocumentIdsByExtractedTextHash,
      isPairDismissed: vi.fn().mockResolvedValue(false),
      upsertCandidate: vi.fn().mockResolvedValue(undefined),
    });
    const linkPair = vi.fn().mockResolvedValue(undefined);
    const stacks = createDuplicateStackRepositoryStub({
      linkPair,
    });
    const linkDuplicatePair = new LinkDuplicatePairUseCase(stacks, duplicates);
    const useCase = new ApplyExactDuplicateDetectionUseCase(
      documents,
      duplicates,
      linkDuplicatePair
    );
    await useCase.execute('doc-new', 'user-1', 'sha-bytes');

    expect(findDocumentIdsByHash).toHaveBeenCalled();
    expect(setExtractedTextHash).toHaveBeenCalledWith('doc-new', textHash);
    expect(findDocumentIdsByExtractedTextHash).toHaveBeenCalledWith(
      'user-1',
      textHash,
      'doc-new'
    );
    expect(linkPair).toHaveBeenCalledTimes(2);
  });
});
