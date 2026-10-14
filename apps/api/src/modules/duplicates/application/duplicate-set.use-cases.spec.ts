// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { duplicateSetIdFromDocumentIds } from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createDuplicateRepositoryStub } from '../../../test-support/duplicate-repository.stub.js';
import { createDuplicateStackRepositoryStub } from '../../../test-support/duplicate-stack-repository.stub.js';
import { ArchiveDuplicateSetUseCase, DismissDuplicateSetUseCase } from './duplicate-set.use-cases.js';

describe('Duplicate set use cases', () => {
  it('dismisses every pair in the set and releases stacked versions', async () => {
    const duplicates = createDuplicateRepositoryStub({ dismiss: vi.fn() });
    const stacks = createDuplicateStackRepositoryStub({
      getMembership: vi.fn().mockResolvedValue({ stackId: 's1', role: 'version' }),
      removeMember: vi.fn(),
    });
    const useCase = new DismissDuplicateSetUseCase(duplicates, stacks);
    const setId = duplicateSetIdFromDocumentIds(['a', 'b', 'c']);

    await useCase.execute('user-1', setId);

    expect(duplicates.dismiss).toHaveBeenCalledTimes(3);
    expect(stacks.removeMember).toHaveBeenCalledTimes(3);
  });

  it('archives older members under the newest document', async () => {
    const newest = new Date('2025-06-01');
    const older = new Date('2024-01-01');
    const docStub = (id: string, createdAt: Date): DocumentEntity => ({
      id,
      userId: 'user-1',
      filename: `${id}.pdf`,
      title: id,
      mimeType: 'application/pdf',
      storageKey: `k/${id}`,
      status: 'ready',
      tags: [],
      createdAt,
      updatedAt: createdAt,
    });
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn(async (id: string) => {
        if (id === 'new') {
          return docStub('new', newest);
        }
        return docStub(id, older);
      }),
    });
    const duplicates = createDuplicateRepositoryStub({ dismiss: vi.fn() });
    const stacks = createDuplicateStackRepositoryStub({
      linkPair: vi.fn(),
      getMembership: vi.fn().mockResolvedValue({ stackId: 's1', role: 'primary' }),
      setPrimary: vi.fn(),
    });
    const useCase = new ArchiveDuplicateSetUseCase(documents, duplicates, stacks);
    const setId = duplicateSetIdFromDocumentIds(['old', 'new']);

    await useCase.execute('user-1', setId);

    expect(stacks.linkPair).toHaveBeenCalledWith('user-1', 'new', 'old');
    expect(duplicates.dismiss).toHaveBeenCalledWith('new', 'old', 'user-1');
  });
});
