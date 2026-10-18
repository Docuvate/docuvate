// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveQuoteInChunk } from './verify-citation-quote.js';

describe('resolveQuoteInChunk grounding variants', () => {
  it('matches OCR body when the model quote adds EUR and label punctuation', () => {
    const body = '/10E Gesamtbrutto (EBeschV) 5.432,10 54.321,00';
    const quote = 'Gesamtbrutto: 5.432,10 EUR';
    const match = resolveQuoteInChunk(body, quote, { claimText: quote });
    expect(match).not.toBeNull();
    expect(match?.bodyQuote).toContain('5.432,10');
  });
});
