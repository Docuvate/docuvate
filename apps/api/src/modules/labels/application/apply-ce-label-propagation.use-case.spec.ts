// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { ApplyCeLabelPropagationUseCase } from './apply-ce-label-propagation.use-case.js';

describe('ApplyCeLabelPropagationUseCase', () => {
  it('auto-assigns only when worker returns auto_assign tier', async () => {
    const assignTag = { execute: vi.fn().mockResolvedValue(undefined) };
    const taxonomy = {
      findTagByIdForUser: vi.fn().mockResolvedValue({ id: 't1', name: 'Rechnung', isInbox: false }),
      upsertSuggestion: vi.fn(),
    };
    const labelEmbeddings = {
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([
        { documentId: 'd1', embedding: [1, 0], nonInboxTagIds: ['t1'] },
        { documentId: 'd2', embedding: [0.9, 0.1], nonInboxTagIds: [] },
        { documentId: 'd3', embedding: [0, 1], nonInboxTagIds: [] },
      ]),
    };
    const ceMl = {
      propagateLabelScores: vi.fn().mockResolvedValue([
        { documentIndex: 1, score: 0.99, tier: 'auto_assign' },
        { documentIndex: 2, score: 0.5, tier: 'suggest' },
      ]),
    };
    const useCase = new ApplyCeLabelPropagationUseCase(
      taxonomy as never,
      labelEmbeddings as never,
      assignTag as never,
      ceMl as never
    );
    const applied = await useCase.propagateAfterLabelSeed('u1', 't1', ['d1']);
    expect(applied).toBe(1);
    expect(assignTag.execute).toHaveBeenCalledWith('d2', 'u1', 't1', { learnFromEmbedding: true });
    expect(taxonomy.upsertSuggestion).toHaveBeenCalledTimes(1);
  });
});
