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

const USER = 'user-cold-cache';

describe('GetLabelRecommendationsUseCase cold hybrid cache', () => {
  it('responds within 500ms when hybrid model is cold', async () => {
    const cache = new LabelHybridModelCacheService();
    vi.spyOn(cache, 'shouldReturnWarmingResponse').mockReturnValue(true);
    const scheduleWarm = vi.spyOn(cache, 'scheduleHybridWarm');

    const confirmedRow = {
      documentId: 'doc-1',
      embedding: [0.1, 0.2, 0.3],
      nonInboxTagIds: ['tag-payroll'],
      title: 'Invoice',
      filename: 'invoice.pdf',
    };

    const labelEmbeddings = createLabelEmbeddingRepositoryStub({
      listUserConfirmedDocumentEmbeddingsForUser: vi.fn().mockResolvedValue([confirmedRow]),
      listDocumentEmbeddingsForUser: vi.fn().mockImplementation(() => new Promise(() => undefined)),
      getTagCentroids: vi.fn().mockImplementation(() => new Promise(() => undefined)),
      listDismissedRecommendationKeys: vi.fn().mockImplementation(() => new Promise(() => undefined)),
      listRecommendationBlocklist: vi.fn().mockImplementation(() => new Promise(() => undefined)),
      listRecommendationBlocklistPatterns: vi.fn().mockImplementation(() => new Promise(() => undefined)),
      listClusterDocumentExclusions: vi.fn().mockImplementation(() => new Promise(() => undefined)),
    });
    const taxonomy = createTaxonomyRepositoryStub({
      listTags: vi.fn().mockImplementation(() => new Promise(() => undefined)),
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

    const started = performance.now();
    const result = await useCase.execute(USER);
    const elapsedMs = performance.now() - started;

    expect(result).toEqual({ items: [], state: 'warming' });
    expect(elapsedMs).toBeLessThan(500);
    expect(scheduleWarm).toHaveBeenCalledOnce();
  });
});
