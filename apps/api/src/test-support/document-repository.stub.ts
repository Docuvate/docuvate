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
    saveExtraction: vi.fn(),
    findLayoutIrForUser: vi.fn(),
    updateForUser: vi.fn(),
    deleteForUser: vi.fn(),
    setTagsForDocument: vi.fn(),
    addTagToDocuments: vi.fn(),
    removeTagFromDocuments: vi.fn(),
    setCorrespondentForDocuments: vi.fn(),
    deleteDocuments: vi.fn(),
    setContentHash: vi.fn(),
    setFolderForDocuments: vi.fn(),
    ...overrides,
  };
}
