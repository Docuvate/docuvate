// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import type { DuplicateRepository, DuplicateStackRepository } from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import { ReleaseDuplicateStackMemberUseCase } from './duplicate-stack.use-cases.js';

describe('duplicate stack user feedback', () => {
  it('stores not_duplicate when user splits a stack from the badge flow', async () => {
    const stacks: Pick<DuplicateStackRepository, 'removeMember'> = {
      removeMember: vi.fn(),
    };
    const duplicates: Pick<DuplicateRepository, 'dismiss' | 'listForDocument'> = {
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
      findByIdForUser: vi.fn().mockImplementation(async (id: string) => ({
        id,
        filename: `${id}.pdf`,
        title: id,
        extraction: { text: 'Annual report body', fields: [], blocks: [{ page: 2 }] },
      })) as (id: string, userId: string) => Promise<DocumentEntity | null>,
    };
    const classifier = {
      recordUserLabel: vi.fn(),
    };

    const useCase = new ReleaseDuplicateStackMemberUseCase(
      stacks as DuplicateStackRepository,
      duplicates as DuplicateRepository,
      documents as never,
      classifier as DuplicateClassifierService
    );

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
