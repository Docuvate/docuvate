// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { normalizeForQuoteMatch, resolveQuoteInCandidateChunk } from './verify-citation-quote.js';

type QuoteHit = NonNullable<ReturnType<typeof resolveQuoteInCandidateChunk>>;

function requireHit(
  hit: ReturnType<typeof resolveQuoteInCandidateChunk>
): QuoteHit {
  expect(hit).not.toBeNull();
  if (hit === null) {
    throw new Error('expected quote hit');
  }
  return hit;
}

function expectQuoteSliceOnOriginalBody(body: string, quote: string, match: QuoteHit): void {
  const slice = body.slice(match.charStart, match.charEnd);
  expect(match.bodyQuote).toBe(slice);
  const firstWord = normalizeForQuoteMatch(quote).split(' ').find(Boolean) ?? '';
  expect(normalizeForQuoteMatch(slice)).toContain(firstWord);
}

describe('quote char ranges on stored chunk body', () => {
  it('maps through soft hyphens before and inside the quote', () => {
    const body = 'Die Mie\u00adte ist bis zum 3.\u00ad Werktag fäl\u00adlig. Ende.';
    const quote = 'bis zum 3. Werktag fällig';
    const hit = requireHit(
      resolveQuoteInCandidateChunk({ documentTitle: 'Mietvertrag', body }, quote, {
        claimText: '',
      })
    );
    expectQuoteSliceOnOriginalBody(body, quote, hit);
    expect(hit.bodyQuote).toContain('\u00ad');
  });

  it('maps through an NFKC ligature before the quoted span', () => {
    const body = 'O\uFB03ce Die Kündigungsfrist beträgt drei Monate zum Quartalsende.';
    const quote = 'drei Monate zum Quartalsende';
    const hit = requireHit(
      resolveQuoteInCandidateChunk({ documentTitle: 'Arbeitsvertrag', body }, quote, {
        claimText: '',
      })
    );
    expectQuoteSliceOnOriginalBody(body, quote, hit);
    expect(body.slice(hit.charStart, hit.charEnd)).toBe(hit.bodyQuote);
    expect(hit.bodyQuote).toContain('drei Monate');
    expect(hit.bodyQuote).not.toMatch(/^ndigungsfrist/);
  });
});
