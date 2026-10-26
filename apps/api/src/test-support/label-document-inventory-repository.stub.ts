// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { LabelDocumentInventoryQueries } from '../modules/labels/infrastructure/pg-label-document-inventory.repository.js';

export function createLabelDocumentInventoryRepositoryStub(
  overrides: Partial<LabelDocumentInventoryQueries> = {}
): LabelDocumentInventoryQueries {
  return {
    loadSummary: vi.fn(),
    listDocumentsPage: vi.fn(),
    loadSampleDocumentIdsByTag: vi.fn().mockResolvedValue(new Map()),
    loadDocumentPreviewsByIds: vi.fn().mockResolvedValue(new Map()),
    ...overrides,
  };
}
