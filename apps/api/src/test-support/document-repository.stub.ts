// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { DocumentRepository } from '../shared/domain/ports.js';

export function createDocumentRepositoryStub(
  overrides: Partial<DocumentRepository> = {}
): DocumentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdForUser: vi.fn(),
    listForUser: vi.fn(),
    updateStatus: vi.fn(),
    setHeuristicFieldExtractorVersion: vi.fn(),
    listDocumentIdsNeedingHeuristicFieldRefresh: vi.fn().mockResolvedValue([]),
    saveExtraction: vi.fn(),
    saveExtractionImages: vi.fn(),
    findLayoutIrForUser: vi.fn(),
    updateForUser: vi.fn(),
    deleteForUser: vi.fn(),
    setTagsForDocument: vi.fn(),
    addTagToDocuments: vi.fn(),
    removeTagFromDocuments: vi.fn(),
    setAbsenderFieldForDocuments: vi.fn(),
    deleteDocuments: vi.fn(),
    setContentHash: vi.fn(),
    setPreviewStorageKey: vi.fn(),
    setFolderForDocuments: vi.fn(),
    moveDocumentsToFolder: vi.fn().mockResolvedValue({ affected: 0, previousFolderIds: [] }),
    ...overrides,
  };
}
