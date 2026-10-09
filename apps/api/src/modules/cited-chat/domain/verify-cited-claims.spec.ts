import { describe, expect, it } from 'vitest';
import { normalizeCitedSourceLabel, verifyCitedClaims } from './verify-cited-claims.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

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

  it('rejects unknown source with reason', () => {
    const top = [chunk('text')];
    const labelByChunk = new Map([[top[0].chunk.chunkId, 'S1']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [{ text: 'x', source: 'S9', quote: 'text' }],
      top,
      labelByChunk,
    });
    expect(verified).toHaveLength(0);
    expect(rejected[0]?.reason).toBe('unknown_source');
  });
});
