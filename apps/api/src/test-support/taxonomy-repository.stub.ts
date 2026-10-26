// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { TaxonomyRepository } from '../shared/domain/ports.js';

export function createTaxonomyRepositoryStub(
  overrides: Partial<TaxonomyRepository> = {}
): TaxonomyRepository {
  return {
    listTags: vi.fn(),
    findTagByIdForUser: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    mergeTags: vi.fn(),
    ensureInboxTag: vi.fn(),
    listCorrespondents: vi.fn(),
    findCorrespondentByIdForUser: vi.fn(),
    createCorrespondent: vi.fn(),
    updateCorrespondent: vi.fn(),
    deleteCorrespondent: vi.fn(),
    listTagsForDocument: vi.fn(),
    assignTagToDocument: vi.fn(),
    removeTagFromDocument: vi.fn(),
    clearInboxTagForDocument: vi.fn(),
    listSuggestions: vi.fn(),
    listSuggestionsForDocuments: vi.fn(),
    listTagsForDocuments: vi.fn(),
    upsertSuggestion: vi.fn(),
    dismissSuggestion: vi.fn(),
    clearSuggestion: vi.fn(),
    ...overrides,
  };
}
