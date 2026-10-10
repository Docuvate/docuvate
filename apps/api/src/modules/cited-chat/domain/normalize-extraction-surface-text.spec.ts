// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { normalizeExtractionSurfaceText } from './normalize-extraction-surface-text.js';
import { resolveQuoteInCandidateChunk } from './verify-citation-quote.js';

describe('normalizeExtractionSurfaceText', () => {
  it('strips soft hyphens for chunk indexing text only', () => {
    const body = 'Die Miete ist bis zum 3.\u00ad Werktag des Monats fällig.';
    const normalized = normalizeExtractionSurfaceText(body);
    expect(normalized).not.toContain('\u00ad');
  });

  it('matches quotes on the original stored body without shifting char ranges', () => {
    const body = 'Die Mie\u00adte ist bis zum 3.\u00ad Werktag des Monats fällig.';
    const hit = resolveQuoteInCandidateChunk(
      { documentTitle: 'Mietvertrag Wohnung', body },
      'bis zum 3. Werktag',
      { claimText: '' }
    );
    expect(hit).not.toBeNull();
    if (hit === null) {
      throw new Error('expected quote hit');
    }
    expect(body.slice(hit.charStart, hit.charEnd)).toBe(hit.bodyQuote);
  });
});
