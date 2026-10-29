// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { vi } from 'vitest';

import type { DocumentExtractionEnqueuePort } from '../modules/documents/domain/document-extraction-enqueue.port.js';

export function createDocumentExtractionEnqueueStub(
  overrides: Partial<DocumentExtractionEnqueuePort> = {}
): DocumentExtractionEnqueuePort {
  return {
    isJobQueuedOrActive: vi.fn(() => Promise.resolve(false)),
    enqueue: vi.fn(() => Promise.resolve()),
    recordOrphanRequeue: vi.fn(() => Promise.resolve(1)),
    ...overrides,
  };
}
