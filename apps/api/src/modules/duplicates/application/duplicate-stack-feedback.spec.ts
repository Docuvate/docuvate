// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_REPOSITORY,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
} from '../../../shared/domain/ports.js';
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import { ReleaseDuplicateStackMemberUseCase } from './duplicate-stack.use-cases.js';

async function buildReleaseUseCase(
  stacks: { removeMember: ReturnType<typeof vi.fn> },
  duplicates: {
    dismiss: ReturnType<typeof vi.fn>;
    listForDocument: ReturnType<typeof vi.fn>;
  },
  documents: { findByIdForUser: ReturnType<typeof vi.fn> },
  classifier: { recordUserLabel: ReturnType<typeof vi.fn> }
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ReleaseDuplicateStackMemberUseCase,
      { provide: DUPLICATE_STACK_REPOSITORY, useValue: stacks },
      { provide: DUPLICATE_REPOSITORY, useValue: duplicates },
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: DuplicateClassifierService, useValue: classifier },
    ],
  }).compile();
  return moduleRef.get(ReleaseDuplicateStackMemberUseCase);
}

describe('duplicate stack user feedback', () => {
  it('stores not_duplicate when user splits a stack from the badge flow', async () => {
    const stacks = { removeMember: vi.fn() };
    const duplicates = {
      dismiss: vi.fn(),
      listForDocument: vi.fn().mockResolvedValue([
        {
          id: 'c1',
          userId: 'user-1',
          documentId: 'primary-1',
          candidateDocumentId: 'version-1',
          candidateTitle: 'version-1',
          candidateFilename: 'version-1.pdf',
          similarity: 0.91,
          source: 'embedding',
          dismissed: false,
        },
      ]),
    };
    const documents = {
      findByIdForUser: vi.fn((id: string) =>
        Promise.resolve({
          id,
          filename: `${id}.pdf`,
          title: id,
          extraction: { text: 'Annual report body', fields: [] },
        })
      ),
    };
    const classifier = { recordUserLabel: vi.fn() };

    const useCase = await buildReleaseUseCase(stacks, duplicates, documents, classifier);

    await useCase.execute('primary-1', 'version-1', 'user-1');

    expect(duplicates.dismiss).toHaveBeenCalledWith('primary-1', 'version-1', 'user-1');
    expect(stacks.removeMember).toHaveBeenCalledWith('user-1', 'version-1');
    expect(classifier.recordUserLabel).toHaveBeenCalledWith(
      'user-1',
      'primary-1',
      'version-1',
      'not_duplicate',
      expect.objectContaining({
        embeddingSimilarity: 0.91,
      })
    );
  });
});
