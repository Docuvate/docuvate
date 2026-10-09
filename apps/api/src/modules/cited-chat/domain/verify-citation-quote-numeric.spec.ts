import { describe, expect, it } from 'vitest';
import { verifyCitedClaims } from './verify-cited-claims.js';
import { resolveQuoteInChunk } from './verify-citation-quote.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

function chunk(body: string): { chunk: CitedChatChunkCandidate } {
  return {
    chunk: {
      chunkId: 'c1',
      documentId: 'd1',
      documentTitle: 'Doc',
      body,
      page: 1,
      charStart: 0,
      charEnd: body.length,
      fusionScore: 0.1,
    },
  };
}

describe('quote numeric guardrails', () => {
  it('rejects wrong invoice amount in quote', () => {
    const body = 'Gesamtsumme: 1.234,56 EUR';
    expect(
      resolveQuoteInChunk(body, 'Gesamtsumme: 9.999,00 EUR', {
        claimText: 'Die Gesamtsumme beträgt 9.999,00 EUR.',
      })
    ).toBeNull();
  });

  it('rejects wrong cents in quote', () => {
    const body = 'Gesamtsumme: 1.234,56 EUR';
    expect(resolveQuoteInChunk(body, 'Gesamtsumme: 1.234,57')).toBeNull();
  });

  it('rejects wrong tax amount with matching words', () => {
    const body = 'Jahresgebühr: 120,00 EUR';
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Hundesteuer beträgt 240,00 EUR im Jahr.',
          source: 'S1',
          quote: 'Jahresgebühr: 240,00 EUR',
        },
      ],
      top: [chunk(body)],
      labelByChunk: new Map([['c1', 'S1']]),
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('quote_not_in_chunk');
  });

  it('rejects claim amount that does not appear in the chunk', () => {
    const body = 'Gesamtsumme: 1.234,56 EUR';
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Gesamtsumme beträgt 5.000,00 EUR.',
          source: 'S1',
          quote: 'Gesamtsumme: 1.234,56 EUR',
        },
      ],
      top: [chunk(body)],
      labelByChunk: new Map([['c1', 'S1']]),
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('claim_number_not_in_quote');
  });

  it('rejects wrong weekday in due-date quote', () => {
    const body = 'Die Miete ist bis zum 3. Werktag des Monats fällig.';
    expect(resolveQuoteInChunk(body, 'bis zum 5. Werktag')).toBeNull();
  });

  it('returns a body slice for a valid fuzzy quote', () => {
    const body = 'Die Miete ist bis zum 3. Werktag des Monats fällig.';
    const hit = resolveQuoteInChunk(body, 'Miete ist bis zum 3. Werktag', {
      claimText: 'Miete bis zum 3. Werktag fällig.',
    });
    expect(hit).not.toBeNull();
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
    expect(hit!.bodyQuote).toContain('3. Werktag');
  });
});
