// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { verifyCitedClaims } from './verify-cited-claims.js';

function row(id: string, body: string): { chunk: CitedChatChunkCandidate } {
  return {
    chunk: {
      chunkId: id,
      documentId: id,
      documentTitle: 'Fixture',
      body,
      page: 1,
      charStart: 0,
      charEnd: body.length,
      fusionScore: 0.2,
    },
  };
}

describe('verifyCitedClaims claim numbers with soft hyphens in stored body', () => {
  const labelByChunk = new Map([['c1', 'S1']]);
  const top = [row('c1', '')];

  it('verifies Miete claim when the matched span contains soft hyphens', () => {
    const body = 'Die Mie\u00adte ist bis zum 3.\u00ad Werktag fäl\u00adlig. Ende.';
    top[0].chunk.body = body;
    top[0].chunk.charEnd = body.length;
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Die Miete ist bis zum 3. Werktag fällig.',
          source: 'S1',
          quote: 'bis zum 3. Werktag fällig',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(body.slice(verified[0].charStart, verified[0].charEnd)).toBe(verified[0].quote);
  });

  it('verifies amount claim when digits are split by a soft hyphen in the body', () => {
    const body = 'Betrag 1.2\u00ad34,56 EUR fällig.';
    top[0].chunk.body = body;
    top[0].chunk.charEnd = body.length;
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Der Betrag ist 1.234,56 EUR.',
          source: 'S1',
          quote: 'Betrag 1.234,56 EUR',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
  });

  it('rejects a wrong amount on the same soft-hyphen body', () => {
    const body = 'Betrag 1.2\u00ad34,56 EUR fällig.';
    top[0].chunk.body = body;
    top[0].chunk.charEnd = body.length;
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Der Betrag ist 1.234,57 EUR.',
          source: 'S1',
          quote: 'Betrag 1.234,56 EUR',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('claim_number_not_in_quote');
  });
});
