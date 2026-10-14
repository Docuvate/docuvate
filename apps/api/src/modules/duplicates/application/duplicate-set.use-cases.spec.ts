// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { duplicateSetIdFromDocumentIds } from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import { createDocumentRepositoryStub } from '../../../test-support/document-repository.stub.js';
import { createDuplicateRepositoryStub } from '../../../test-support/duplicate-repository.stub.js';
import { createDuplicateStackRepositoryStub } from '../../../test-support/duplicate-stack-repository.stub.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { BadRequestException } from '@nestjs/common';

import {
  ArchiveDuplicateSetUseCase,
  DismissDuplicateSetUseCase,
  ListDuplicateSetsUseCase,
} from './duplicate-set.use-cases.js';

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

    expect(duplicates.dismiss).toHaveBeenCalledTimes(3); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
    expect(stacks.removeMember).toHaveBeenCalledTimes(3); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
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
      findByIdForUser: vi.fn((id: string) => {
        if (id === 'new') {
          return Promise.resolve(docStub('new', newest));
        }
        return Promise.resolve(docStub(id, older));
      }),
    });
    const duplicates = createDuplicateRepositoryStub({
      dismiss: vi.fn(),
      listActiveCandidates: vi.fn().mockResolvedValue([
        {
          documentId: 'old',
          candidateDocumentId: 'new',
          similarity: 1,
          source: 'hash',
          dismissed: false,
        },
      ]),
    });
    const stacks = createDuplicateStackRepositoryStub({
      linkPair: vi.fn(),
      getMembership: vi.fn().mockResolvedValue({ stackId: 's1', role: 'primary' }),
      setPrimary: vi.fn(),
    });
    const useCase = new ArchiveDuplicateSetUseCase(documents, duplicates, stacks);
    const setId = duplicateSetIdFromDocumentIds(['old', 'new']);

    await useCase.execute('user-1', setId);

    expect(stacks.linkPair).toHaveBeenCalledWith('user-1', 'new', 'old'); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
    expect(duplicates.dismiss).toHaveBeenCalledWith('new', 'old', 'user-1'); // eslint-disable-line @typescript-eslint/unbound-method -- vitest mock
  });

  it('rejects bulk archive for similarity-only duplicate sets', async () => {
    const documents = createDocumentRepositoryStub();
    const duplicates = createDuplicateRepositoryStub({
      listActiveCandidates: vi.fn().mockResolvedValue([
        {
          documentId: 'a',
          candidateDocumentId: 'b',
          similarity: 0.99,
          source: 'embedding',
          dismissed: false,
        },
      ]),
    });
    const stacks = createDuplicateStackRepositoryStub();
    const useCase = new ArchiveDuplicateSetUseCase(documents, duplicates, stacks);
    const setId = duplicateSetIdFromDocumentIds(['a', 'b']);
    await expect(useCase.execute('user-1', setId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks hash-only sets as bulk-archive eligible with floored similarity percent', async () => {
    const duplicates = createDuplicateRepositoryStub({
      listActiveCandidates: vi.fn().mockResolvedValue([
        {
          documentId: 'a',
          candidateDocumentId: 'b',
          similarity: 1,
          source: 'hash',
          dismissed: false,
        },
      ]),
    });
    const newest = new Date('2025-01-01');
    const documents = createDocumentRepositoryStub({
      findByIdForUser: vi.fn((id: string) =>
        Promise.resolve({
          id,
          userId: 'user-1',
          filename: `${id}.pdf`,
          title: id,
          mimeType: 'application/pdf',
          storageKey: `k/${id}`,
          status: 'ready',
          tags: [],
          createdAt: newest,
          updatedAt: newest,
        })
      ),
    });
    const useCase = new ListDuplicateSetsUseCase(duplicates, documents);
    const sets = await useCase.execute('user-1');
    expect(sets).toHaveLength(1);
    expect(sets[0]?.bulkArchiveEligible).toBe(true);
    expect(sets[0]?.similarityPercent).toBe(100);
  });
});
