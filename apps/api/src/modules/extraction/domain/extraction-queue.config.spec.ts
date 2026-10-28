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

  it('follows the worker capacity when env is unset (1 slot on a 2 GiB worker)', () => {
    delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    expect(documentExtractionConcurrency(1)).toBe(1);
    expect(documentExtractionConcurrency(3)).toBe(3);
  });

  it('never exceeds worker capacity even when env asks for more', () => {
    process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = '4';
    expect(documentExtractionConcurrency(1)).toBe(1);
  });

  it('lets env cap below worker capacity', () => {
    process.env['DOCUMENT_EXTRACTION_CONCURRENCY'] = '2';
    expect(documentExtractionConcurrency(3)).toBe(2);
  });

  it('treats an invalid worker report as one slot', () => {
    delete process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
    expect(documentExtractionConcurrency(0)).toBe(1);
    expect(documentExtractionConcurrency(Number.NaN)).toBe(1);
  });
});
