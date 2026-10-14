// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { normalizeCitedSourceLabel, verifyCitedClaims } from './verify-cited-claims.js';

function chunk(body: string, id = 'c1'): { chunk: CitedChatChunkCandidate } {
  return {
    chunk: {
      chunkId: id,
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

describe('verifyCitedClaims', () => {
  it('normalizes source labels', () => {
    const labels = new Set(['S1', 'S2']);
    expect(normalizeCitedSourceLabel('s1', labels)).toBe('S1');
    expect(normalizeCitedSourceLabel('Quelle S2', labels)).toBe('S2');
    expect(normalizeCitedSourceLabel('2', labels)).toBe('S2');
  });

  it('rejects chunk-dump claims that echo long passages', () => {
    const body = 'Die Miete ist bis zum 3. Werktag des Monats fällig.';
    const top = [chunk(body)];
    const labelByChunk = new Map([[top[0].chunk.chunkId, 'S1']]);
    const junk = 'Randnotiz '.repeat(30);
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: `${junk} bis zum 3. Werktag ${junk}`,
          source: 'S1',
          quote: 'bis zum 3. Werktag',
        },
      ],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('claim_is_chunk_dump');
  });

  it('verifies quote with fuzzy re-anchor when model shortens quote', () => {
    const body = 'Die Miete ist bis zum 3. Werktag des Monats fällig.';
    const top = [chunk(body)];
    const labelByChunk = new Map([[top[0].chunk.chunkId, 'S1']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Miete bis zum 3. Werktag fällig.',
          source: 'S1',
          quote: 'bis zum 3. Werktag',
        },
      ],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(body).toContain(verified[0].quote);
  });

  it('maps unknown source to the best quote-matching chunk', () => {
    const top = [chunk('text')];
    const labelByChunk = new Map([[top[0].chunk.chunkId, 'S1']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [{ text: 'x', source: 'S9', quote: 'text' }],
      top,
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(verified[0]?.chunkId).toBe(top[0].chunk.chunkId);
  });

  it('rejects unknown source when quote does not match any chunk', () => {
    const top = [chunk('text')];
    const labelByChunk = new Map([[top[0].chunk.chunkId, 'S1']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [{ text: 'x', source: 'S9', quote: 'missing snippet' }],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('unknown_source');
  });
});
