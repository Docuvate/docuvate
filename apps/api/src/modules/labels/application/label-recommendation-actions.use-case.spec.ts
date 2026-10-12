// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/* eslint-disable @typescript-eslint/consistent-type-assertions -- vitest partial mocks */
import { describe, expect, it, vi } from 'vitest';

import { AcceptLabelRecommendationUseCase } from './label-recommendation-actions.use-case.js';

const USER = 'user-1';
const DOC = 'doc-1';
const TAG = 'tag-1';

describe('AcceptLabelRecommendationUseCase', () => {
  it('accepts assign recommendations when document embeddings are missing', async () => {
    const assignTag = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    const labelEmbeddings = {
      dismissRecommendation: vi.fn().mockResolvedValue(undefined),
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([]),
      getTagCentroids: vi.fn().mockResolvedValue([]),
    };
    const prefs = {
      getForUser: vi.fn().mockResolvedValue({ labelNearSimilarityThreshold: 0.7 }),
      upsert: vi.fn().mockResolvedValue(undefined),
    };
    const taxonomy = {};

    const useCase = new AcceptLabelRecommendationUseCase(
      taxonomy as never,
      labelEmbeddings as never,
      prefs as never,
      assignTag as never
    );

    const recommendationId = `assign:${DOC}:${TAG}`;
    const result = await useCase.execute(USER, { recommendationId, tagId: TAG });

    expect(result).toEqual({ tagId: TAG, action: 'assigned', documentId: DOC });
    expect(assignTag.execute).toHaveBeenCalledWith(DOC, USER, TAG, { learnFromEmbedding: true });
    expect(labelEmbeddings.dismissRecommendation).toHaveBeenCalledWith(USER, recommendationId);
  });
});
