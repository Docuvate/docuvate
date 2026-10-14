// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { DuplicateRepository } from '../shared/domain/ports.js';

export function createDuplicateRepositoryStub(
  overrides: Partial<DuplicateRepository> = {}
): DuplicateRepository {
  return {
    upsertCandidate: vi.fn(),
    listForDocument: vi.fn(),
    dismiss: vi.fn(),
    undismiss: vi.fn(),
    isPairDismissed: vi.fn(),
    countPendingByDocumentIds: vi.fn(),
    findDocumentIdsByHash: vi.fn(),
    listDocumentEmbeddings: vi.fn(),
    listPendingPairs: vi.fn(),
    listActiveCandidates: vi.fn(),
    listDocumentIdsBySharedHash: vi.fn(),
    listSmartDuplicatePeers: vi.fn(),
    ...overrides,
  };
}
