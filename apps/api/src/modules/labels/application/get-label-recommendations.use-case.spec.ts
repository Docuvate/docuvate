// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { createLabelEmbeddingRepositoryStub } from '../../../test-support/label-embedding-repository.stub.js';
import { createTaxonomyRepositoryStub } from '../../../test-support/taxonomy-repository.stub.js';
import {
  createUserPreferencesEntity,
  createUserPreferencesRepositoryStub,
} from '../../../test-support/user-preferences-repository.stub.js';
import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';
import type { PgLabelDocumentInventoryRepository } from '../infrastructure/pg-label-document-inventory.repository.js';
import { GetLabelRecommendationsUseCase } from './get-label-recommendations.use-case.js';

function createInventoryRepoStub(): PgLabelDocumentInventoryRepository {
  return {
    loadSummary: vi.fn(),
    listDocumentsPage: vi.fn(),
    loadSampleDocumentIdsByTag: vi.fn().mockResolvedValue(new Map()),
    loadDocumentPreviewsByIds: vi.fn().mockResolvedValue(new Map()),
  } as unknown as PgLabelDocumentInventoryRepository;
}

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
      createInventoryRepoStub()
    );

    const result = await useCase.execute(USER);
    expect(result).toEqual({ items: [], state: 'ready' });
  });
});
