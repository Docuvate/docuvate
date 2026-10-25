// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { LabelEmbeddingRepository } from '../shared/domain/ports.js';

export function createLabelEmbeddingRepositoryStub(
  overrides: Partial<LabelEmbeddingRepository> = {}
): LabelEmbeddingRepository {
  return {
    saveDocumentEmbedding: vi.fn(),
    getDocumentEmbedding: vi.fn(),
    countExtractedDocumentsForMap: vi.fn(),
    listDocumentIdsMissingEmbeddings: vi.fn(),
    listDocumentEmbeddingsForUser: vi.fn(),
    listUserConfirmedDocumentEmbeddingsForUser: vi.fn(),
    listLabeledDocumentEmbeddings: vi.fn(),
    getTagCentroids: vi.fn(),
    listDismissedRecommendationKeys: vi.fn(),
    dismissRecommendation: vi.fn(),
    listClusterDocumentExclusions: vi.fn(),
    addClusterDocumentExclusions: vi.fn(),
    listRecommendationBlocklist: vi.fn(),
    addRecommendationBlocklist: vi.fn(),
    removeRecommendationBlocklist: vi.fn(),
    listRecommendationBlocklistPatterns: vi.fn(),
    addRecommendationBlocklistPattern: vi.fn(),
    removeRecommendationBlocklistPattern: vi.fn(),
    saveTagCentroid: vi.fn(),
    recordFeedback: vi.fn(),
    countRejectionsForTag: vi.fn(),
    ...overrides,
  };
}
