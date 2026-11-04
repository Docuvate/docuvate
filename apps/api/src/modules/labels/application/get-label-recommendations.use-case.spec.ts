// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { createLabelDocumentInventoryRepositoryStub } from '../../../test-support/label-document-inventory-repository.stub.js';
import { createLabelEmbeddingRepositoryStub } from '../../../test-support/label-embedding-repository.stub.js';
import { createTaxonomyRepositoryStub } from '../../../test-support/taxonomy-repository.stub.js';
import {
  createUserPreferencesEntity,
  createUserPreferencesRepositoryStub,
} from '../../../test-support/user-preferences-repository.stub.js';
import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';
import { GetLabelRecommendationsUseCase } from './get-label-recommendations.use-case.js';

const USER = 'user-rec-1';

describe('GetLabelRecommendationsUseCase', () => {
  it('returns an empty list when there are no tags or documents', async () => {
    const cache = new LabelHybridModelCacheService();
    vi.spyOn(cache, 'shouldReturnWarmingResponse').mockReturnValue(false);
    vi.spyOn(cache, 'resolveModelForInference').mockReturnValue(null);

    const taxonomy = createTaxonomyRepositoryStub({
      listTags: vi.fn().mockResolvedValue([]),
    });
    const labelEmbeddings = createLabelEmbeddingRepositoryStub({
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([]),
      listUserConfirmedDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([]),
      getTagCentroids: vi.fn().mockResolvedValue([]),
      listDismissedRecommendationKeys: vi.fn().mockResolvedValue([]),
      listRecommendationBlocklist: vi.fn().mockResolvedValue([]),
      listRecommendationBlocklistPatterns: vi.fn().mockResolvedValue([]),
      listClusterDocumentExclusions: vi.fn().mockResolvedValue([]),
    });
    const prefs = createUserPreferencesRepositoryStub({
      getForUser: vi
        .fn()
        .mockResolvedValue(createUserPreferencesEntity({ labelNearSimilarityThreshold: 0.7 })),
    });

    const useCase = new GetLabelRecommendationsUseCase(
      taxonomy,
      labelEmbeddings,
      prefs,
      cache,
      createLabelDocumentInventoryRepositoryStub()
    );

    const result = await useCase.execute(USER);
    expect(result).toEqual({ items: [], state: 'ready' });
  });

  it('never suggests merging sibling labels with near-identical names and embeddings', async () => {
    const cache = new LabelHybridModelCacheService();
    vi.spyOn(cache, 'shouldReturnWarmingResponse').mockReturnValue(false);
    vi.spyOn(cache, 'resolveModelForInference').mockReturnValue(null);
    const tag = (id: string, name: string): TagEntity => ({
      id,
      userId: USER,
      name,
      isInbox: false,
      matchingAlgorithm: 'none',
      match: '',
    });
    const rows = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'].map((documentId, index) => ({
      documentId,
      title: documentId,
      filename: `${documentId}.pdf`,
      embedding: [1, 0.01 * index, 0],
      nonInboxTagIds: [documentId.startsWith('a') ? 'sem-1' : 'sem-2'],
    }));
    const taxonomy = createTaxonomyRepositoryStub({
      listTags: vi.fn().mockResolvedValue([tag('sem-1', '1. Semester'), tag('sem-2', '2. Semester')]),
    });
    const labelEmbeddings = createLabelEmbeddingRepositoryStub({
      listDocumentEmbeddingsForUser: vi.fn().mockResolvedValue(rows),
      listUserConfirmedDocumentEmbeddingsForUser: vi.fn().mockResolvedValue(rows),
      getTagCentroids: vi.fn().mockResolvedValue([
        { tagId: 'sem-1', sampleCount: 3, centroid: [1, 0.01, 0] },
        { tagId: 'sem-2', sampleCount: 3, centroid: [1, 0.04, 0] },
      ]),
      listDismissedRecommendationKeys: vi.fn().mockResolvedValue([]),
      listRecommendationBlocklist: vi.fn().mockResolvedValue([]),
      listRecommendationBlocklistPatterns: vi.fn().mockResolvedValue([]),
      listClusterDocumentExclusions: vi.fn().mockResolvedValue([]),
    });
    const prefs = createUserPreferencesRepositoryStub({
      getForUser: vi
        .fn()
        .mockResolvedValue(createUserPreferencesEntity({ labelNearSimilarityThreshold: 0.7 })),
    });
    const useCase = new GetLabelRecommendationsUseCase(
      taxonomy,
      labelEmbeddings,
      prefs,
      cache,
      createLabelDocumentInventoryRepositoryStub()
    );

    const result = await useCase.execute(USER);
    expect(result.items.filter((item) => item.kind === 'merge')).toEqual([]);
  });
});
