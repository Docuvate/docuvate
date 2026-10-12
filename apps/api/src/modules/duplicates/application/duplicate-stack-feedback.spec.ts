// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/* eslint-disable @typescript-eslint/consistent-type-assertions -- vitest partial mocks */
import { describe, expect, it, vi } from 'vitest';

import type {
  DocumentRepository,
  DuplicateRepository,
  DuplicateStackRepository,
} from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { DuplicateClassifierService } from '../domain/duplicate-classifier.service.js';
import { ReleaseDuplicateStackMemberUseCase } from './duplicate-stack.use-cases.js';

describe('duplicate stack user feedback', () => {
  it('stores not_duplicate when user splits a stack from the badge flow', async () => {
    const stacks = {
      removeMember: vi.fn(),
    } satisfies Pick<DuplicateStackRepository, 'removeMember'>;
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
          source: 'embedding' as const,
          dismissed: false,
        },
      ]),
    } satisfies Pick<DuplicateRepository, 'dismiss' | 'listForDocument'>;
    const documents: Pick<DocumentRepository, 'findByIdForUser'> = {
      findByIdForUser: vi.fn((id: string) =>
        Promise.resolve({
          id,
          filename: `${id}.pdf`,
          title: id,
          extraction: { text: 'Annual report body', fields: [], blocks: [{ page: 2 }] },
        } satisfies Pick<DocumentEntity, 'id' | 'filename' | 'title' | 'extraction'> as DocumentEntity)
      ),
    };
    const classifier = {
      recordUserLabel: vi.fn(),
    } satisfies Pick<DuplicateClassifierService, 'recordUserLabel'>;

    const useCase = new ReleaseDuplicateStackMemberUseCase(
      stacks as DuplicateStackRepository,
      duplicates as DuplicateRepository,
      documents as DocumentRepository,
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
