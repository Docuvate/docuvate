// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { DuplicateStackRepository } from '../shared/domain/ports.js';

export function createDuplicateStackRepositoryStub(
  overrides: Partial<DuplicateStackRepository> = {}
): DuplicateStackRepository {
  return {
    syncFromPendingCandidates: vi.fn(),
    linkPair: vi.fn(),
    getMembership: vi.fn(),
    listMembers: vi.fn(),
    summariesForPrimaryDocuments: vi.fn(),
    setPrimary: vi.fn(),
    removeMember: vi.fn(),
    handleDocumentDeleted: vi.fn(),
    ...overrides,
  };
}
