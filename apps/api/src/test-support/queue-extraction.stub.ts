// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { QueueExtractionUseCase } from '../modules/documents/application/queue-extraction.use-case.js';

export function createQueueExtractionStub(
  overrides: Partial<Pick<QueueExtractionUseCase, 'execute'>> = {}
) {
  return {
    execute: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
