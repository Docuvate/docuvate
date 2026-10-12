// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/* eslint-disable @typescript-eslint/consistent-type-assertions -- vitest partial mocks */
import { describe, expect, it, vi } from 'vitest';

import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { AcceptLabelRecommendationUseCase } from './label-recommendation-actions.use-case.js';

const USER = 'user-1';
const DOC = 'doc-1';
const TAG = 'tag-1';
const DOC_A = '11111111-1111-4111-8111-111111111111';
const DOC_B = '22222222-2222-4222-8222-222222222222';

function tag(id: string, name: string): TagEntity {
  return {
    id,
    userId: USER,
    name,
    color: '#64748b',
    isInbox: false,
    matchingAlgorithm: 'any',
    match: name,
  };
}

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

  it('creates a cluster label and assigns sample documents when documentIds are provided', async () => {
    const createdTag = tag('tag-new', 'Cluster Label');
    const assignTag = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    const taxonomy = {
      listTags: vi.fn().mockResolvedValue([]),
      createTag: vi.fn().mockResolvedValue(createdTag),
    };
    const labelEmbeddings = {
      dismissRecommendation: vi.fn().mockResolvedValue(undefined),
    };
    const prefs = {
      getForUser: vi.fn(),
      upsert: vi.fn(),
    };

    const useCase = new AcceptLabelRecommendationUseCase(
      taxonomy as never,
      labelEmbeddings as never,
      prefs as never,
      assignTag as never
    );

    const result = await useCase.execute(USER, {
      recommendationId: 'new:cluster:cluster-label',
      proposedName: 'Cluster Label',
      documentIds: [DOC_A, DOC_B],
    });

    expect(result).toEqual({ tagId: createdTag.id, action: 'created' });
    expect(taxonomy.createTag).toHaveBeenCalledWith(USER, 'Cluster Label', {
      color: '#64748b',
      matchingAlgorithm: 'any',
      match: 'Cluster Label',
    });
    expect(assignTag.execute).toHaveBeenCalledTimes(2);
    expect(assignTag.execute).toHaveBeenCalledWith(DOC_A, USER, createdTag.id, {
      learnFromEmbedding: true,
    });
    expect(assignTag.execute).toHaveBeenCalledWith(DOC_B, USER, createdTag.id, {
      learnFromEmbedding: true,
    });
    expect(labelEmbeddings.dismissRecommendation).toHaveBeenCalledWith(
      USER,
      'new:cluster:cluster-label'
    );
  });
});
