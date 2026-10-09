import { describe, expect, it } from 'vitest';
import { extractCompleteCitedClaims } from './extract-complete-cited-claims.js';

describe('extractCompleteCitedClaims', () => {
  it('returns only closed claim objects from partial json', () => {
    const partial =
      '{"claims":[{"text":"A","source":"S1","quote":"q1"},{"text":"B","source":"S2","quote":"q2';
    expect(extractCompleteCitedClaims(partial)).toEqual([
      { text: 'A', source: 'S1', quote: 'q1' },
    ]);
  });
});
