// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { normalizeForQuoteMatch, resolveQuoteInCandidateChunk } from './verify-citation-quote.js';

function expectQuoteSliceOnOriginalBody(
  body: string,
  quote: string,
  match: NonNullable<ReturnType<typeof resolveQuoteInCandidateChunk>>
): void {
  const slice = body.slice(match.charStart, match.charEnd);
  expect(match.bodyQuote).toBe(slice);
  expect(normalizeForQuoteMatch(slice)).toContain(
    normalizeForQuoteMatch(quote).split(' ').filter(Boolean)[0] ?? ''
  );
}

describe('quote char ranges on stored chunk body', () => {
  it('maps through soft hyphens before and inside the quote', () => {
    const body = 'Die Mie\u00adte ist bis zum 3.\u00ad Werktag fäl\u00adlig. Ende.';
    const quote = 'bis zum 3. Werktag fällig';
    const hit = resolveQuoteInCandidateChunk(
      { documentTitle: 'Mietvertrag', body },
      quote,
      { claimText: '' }
    );
    expect(hit).not.toBeNull();
    expectQuoteSliceOnOriginalBody(body, quote, hit!);
    expect(hit!.bodyQuote).toContain('\u00ad');
  });

  it('maps through an NFKC ligature before the quoted span', () => {
    const body = 'O\uFB03ce Die Kündigungsfrist beträgt drei Monate zum Quartalsende.';
    const quote = 'drei Monate zum Quartalsende';
    const hit = resolveQuoteInCandidateChunk(
      { documentTitle: 'Arbeitsvertrag', body },
      quote,
      { claimText: '' }
    );
    expect(hit).not.toBeNull();
    expectQuoteSliceOnOriginalBody(body, quote, hit!);
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
    expect(hit!.bodyQuote).toContain('drei Monate');
    expect(hit!.bodyQuote).not.toMatch(/^ndigungsfrist/);
  });
});
