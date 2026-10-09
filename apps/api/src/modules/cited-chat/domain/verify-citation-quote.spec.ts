import { describe, expect, it } from 'vitest';
import {
  findQuoteInChunk,
  normalizeForQuoteMatch,
  passesFusionGate,
  passesRerankerGate,
  truncateQuoteWords,
} from './verify-citation-quote.js';
import { reciprocalRankFusion } from '../../search/domain/reciprocal-rank-fusion.js';

describe('verify-citation-quote', () => {
  it('normalizes quotes for matching', () => {
    expect(normalizeForQuoteMatch('  Rechnung   „123“  ')).toBe('rechnung 123');
  });

  it('finds quote in chunk body with body-relative offsets and stored substring', () => {
    const body = 'Die Gesamtsumme beträgt 1.234,56 EUR fällig am 15.03.';
    const hit = findQuoteInChunk(body, 'Gesamtsumme beträgt 1.234,56');
    expect(hit).not.toBeNull();
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
    expect(hit!.bodyQuote).toContain('Gesamtsumme');
  });

  it('maps typographic quotes and double spaces to original body indices', () => {
    const body = 'Summe  „1.234,56“   EUR';
    const hit = findQuoteInChunk(body, '„1.234,56“');
    expect(hit).not.toBeNull();
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
    expect(hit!.bodyQuote).toMatch(/1\.234,56/);
  });

  it('handles umlauts without normalized-length drift', () => {
    const body = 'Größe der Hundesteuer: 120 EUR';
    const hit = findQuoteInChunk(body, 'Hundesteuer');
    expect(hit).not.toBeNull();
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
  });

  it('truncates long quotes to ten words', () => {
    expect(truncateQuoteWords('a b c d e f g h i j k l')).toBe('a b c d e f g h i j');
  });

  it('matches quotes across line breaks in chunk body', () => {
    const body = 'Die Miete ist\nbis zum 3. Werktag\ndes Monats fällig.';
    const hit = findQuoteInChunk(body, 'Miete ist bis zum 3. Werktag');
    expect(hit).not.toBeNull();
    expect(body.slice(hit!.charStart, hit!.charEnd)).toBe(hit!.bodyQuote);
  });

  it('matches German currency formatting variants', () => {
    const body = 'Gesamtsumme: 1.234,56 EUR';
    const hit = findQuoteInChunk(body, 'Gesamtsumme 1234.56 EUR');
    expect(hit).not.toBeNull();
    expect(hit!.bodyQuote).toContain('1.234,56');
  });

  it('gate rejects low reranker scores', () => {
    expect(passesRerankerGate(0.2, 0.28)).toBe(false);
    expect(passesRerankerGate(0.29, 0.28)).toBe(true);
  });

  it('fusion gate rejects weak RRF scores', () => {
    expect(passesFusionGate(0.01, 0.02)).toBe(false);
    expect(passesFusionGate(0.03, 0.02)).toBe(true);
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
