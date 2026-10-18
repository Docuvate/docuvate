// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { AssignDocumentTag } from '../modules/labels/domain/assign-document-tag.port.js';

export function createAssignDocumentTagUseCaseStub(
  overrides: Partial<AssignDocumentTag> = {}
): AssignDocumentTag {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
