import { describe, expect, it, vi } from 'vitest';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';
import type { DuplicateRepository, DuplicateStackRepository } from '../../../shared/domain/ports.js';

describe('LinkDuplicatePairUseCase', () => {
  it('skips linking when the pair was dismissed as not duplicate', async () => {
    const stacks = { linkPair: vi.fn() } as unknown as DuplicateStackRepository;
    const duplicates = {
      isPairDismissed: vi.fn().mockResolvedValue(true),
    } as unknown as DuplicateRepository;
    const useCase = new LinkDuplicatePairUseCase(stacks, duplicates);

    await useCase.execute('user-1', 'doc-a', 'doc-b');

    expect(duplicates.isPairDismissed).toHaveBeenCalledWith('user-1', 'doc-a', 'doc-b');
    expect(stacks.linkPair).not.toHaveBeenCalled();
  });

  it('links when the pair is not dismissed', async () => {
    const stacks = { linkPair: vi.fn() } as unknown as DuplicateStackRepository;
    const duplicates = {
      isPairDismissed: vi.fn().mockResolvedValue(false),
    } as unknown as DuplicateRepository;
    const useCase = new LinkDuplicatePairUseCase(stacks, duplicates);

    await useCase.execute('user-1', 'doc-a', 'doc-b');

    expect(stacks.linkPair).toHaveBeenCalledWith('user-1', 'doc-a', 'doc-b');
  });
});
