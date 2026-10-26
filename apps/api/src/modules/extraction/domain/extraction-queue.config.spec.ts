// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { documentExtractionConcurrency } from './extraction-queue.config.js';

describe('documentExtractionConcurrency', () => {
  const previous = process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];

  afterEach(() => {
    if (previous === undefined) {
      delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    } else {
      process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = previous;
    }
  });

  it('uses explicit env when set', () => {
    process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = '2';
    expect(documentExtractionConcurrency()).toBe(2);
  });

  it('falls back to worker-slot ceiling when unset', () => {
    delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    expect(documentExtractionConcurrency()).toBe(4);
  });
});
