// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { UserPreferencesEntity, UserPreferencesRepository } from '../shared/domain/ports.js';

export function createUserPreferencesEntity(
  overrides: Partial<UserPreferencesEntity> = {}
): UserPreferencesEntity {
  return {
    userId: 'user',
    preferredExtractorEngine: 'default',
    preferredChatProvider: null,
    useArenaWinnerAsDefault: false,
    arenaWinnerEngine: null,
    labelFieldConfidenceThreshold: 0.5,
    labelNearSimilarityThreshold: 0.7,
    fieldExtractionConfidenceGateEnabled: false,
    fieldExtractionRequiredLabelIds: [],
    advancedFeaturesEnabled: false,
    themePreference: 'system',
    locale: null,
    documentChatCloudBaseUrl: null,
    documentChatCloudApiKey: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createUserPreferencesRepositoryStub(
  overrides: Partial<UserPreferencesRepository> = {}
): UserPreferencesRepository {
  return {
    getForUser: vi.fn().mockResolvedValue(createUserPreferencesEntity()),
    upsert: vi.fn(),
    recordArenaRating: vi.fn(),
    ...overrides,
  };
}
