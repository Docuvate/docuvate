// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
} from '../../../shared/domain/ports.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';

async function buildUseCase(
  stacks: { linkPair: ReturnType<typeof vi.fn> },
  duplicates: { isPairDismissed: ReturnType<typeof vi.fn> }
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      LinkDuplicatePairUseCase,
      { provide: DUPLICATE_STACK_REPOSITORY, useValue: stacks },
      { provide: DUPLICATE_REPOSITORY, useValue: duplicates },
    ],
  }).compile();
  return moduleRef.get(LinkDuplicatePairUseCase);
}

describe('LinkDuplicatePairUseCase', () => {
  it('skips linking when the pair was dismissed as not duplicate', async () => {
    const stacks = { linkPair: vi.fn() };
    const duplicates = {
      isPairDismissed: vi.fn().mockResolvedValue(true),
    };
    const useCase = await buildUseCase(stacks, duplicates);

    await useCase.execute('user-1', 'doc-a', 'doc-b');

    expect(duplicates.isPairDismissed).toHaveBeenCalledWith('user-1', 'doc-a', 'doc-b');
    expect(stacks.linkPair).not.toHaveBeenCalled();
  });

  it('links when the pair is not dismissed', async () => {
    const stacks = { linkPair: vi.fn() };
    const duplicates = {
      isPairDismissed: vi.fn().mockResolvedValue(false),
    };
    const useCase = await buildUseCase(stacks, duplicates);

    await useCase.execute('user-1', 'doc-a', 'doc-b');

    expect(stacks.linkPair).toHaveBeenCalledWith('user-1', 'doc-a', 'doc-b');
  });
});
