// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { AssignDocumentTagUseCase } from '../modules/labels/application/document-label.use-cases.js';

export function createAssignDocumentTagUseCaseStub(
  overrides: Partial<Pick<AssignDocumentTagUseCase, 'execute'>> = {}
): AssignDocumentTagUseCase {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as AssignDocumentTagUseCase;
}
