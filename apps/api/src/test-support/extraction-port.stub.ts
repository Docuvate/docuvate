// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { ExtractionPort } from '../shared/domain/ports.js';

export function createExtractionPortStub(
  overrides: Partial<ExtractionPort> = {}
): ExtractionPort {
  return {
    extract: vi.fn(),
    listEngines: vi.fn().mockResolvedValue([]),
    compare: vi.fn().mockResolvedValue({ items: [], engines: [] }),
    ...overrides,
  };
}
