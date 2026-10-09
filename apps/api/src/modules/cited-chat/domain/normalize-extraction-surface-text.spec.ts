// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { normalizeExtractionSurfaceText } from './normalize-extraction-surface-text.js';
import { resolveQuoteInCandidateChunk } from './verify-citation-quote.js';

describe('normalizeExtractionSurfaceText', () => {
  it('removes soft hyphens so quotes match across PDF line breaks', () => {
    const body = 'Die Miete ist bis zum 3.\u00ad Werktag des Monats fällig.';
    const normalized = normalizeExtractionSurfaceText(body);
    expect(normalized).not.toContain('\u00ad');
    const hit = resolveQuoteInCandidateChunk(
      { documentTitle: 'Mietvertrag Wohnung', body: normalized },
      'bis zum 3. Werktag',
      { claimText: '' }
    );
    expect(hit).not.toBeNull();
  });
});
