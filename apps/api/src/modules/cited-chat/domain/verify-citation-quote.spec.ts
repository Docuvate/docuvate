import { describe, expect, it } from 'vitest';
import {
  findQuoteInChunk,
  normalizeForQuoteMatch,
  passesRerankerGate,
  truncateQuoteWords,
} from './verify-citation-quote.js';
import { reciprocalRankFusion } from '../../search/domain/reciprocal-rank-fusion.js';

describe('verify-citation-quote', () => {
  it('normalizes quotes for matching', () => {
    expect(normalizeForQuoteMatch('  Rechnung   „123“  ')).toBe('rechnung 123');
  });

  it('finds quote in chunk body', () => {
    const body = 'Die Gesamtsumme beträgt 1.234,56 EUR fällig am 15.03.';
    const hit = findQuoteInChunk(body, 'Gesamtsumme beträgt 1.234,56');
    expect(hit).not.toBeNull();
    expect(hit!.charStart).toBeGreaterThanOrEqual(0);
  });

  it('truncates long quotes to ten words', () => {
    expect(truncateQuoteWords('a b c d e f g h i j k l')).toBe('a b c d e f g h i j');
  });

  it('gate rejects low reranker scores', () => {
    expect(passesRerankerGate(-0.5, 0)).toBe(false);
    expect(passesRerankerGate(1.2, 0)).toBe(true);
  });
});

describe('reciprocalRankFusion', () => {
  it('fuses two ranked lists', () => {
    const scores = reciprocalRankFusion([
      [{ id: 'a', rank: 1 }, { id: 'b', rank: 2 }],
      [{ id: 'b', rank: 1 }, { id: 'c', rank: 2 }],
    ]);
    expect(scores.get('b')).toBeGreaterThan(scores.get('a') ?? 0);
  });
});
