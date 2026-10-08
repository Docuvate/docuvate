import { describe, expect, it } from 'vitest';
import {
  buildHighlightTerms,
  fuzzyWordMatch,
  highlightFuzzyMatches,
} from './highlight-fuzzy.js';

function sliceHighlight(text: string, spans: Array<{ start: number; end: number }>): string[] {
  return spans.map((s) => text.slice(s.start, s.end));
}

describe('highlightFuzzyMatches', () => {
  it('highlights typo-tolerant token matches in title', () => {
    const text = 'Monatliche Rechnung Nordwind GmbH';
    const spans = highlightFuzzyMatches(text, ['rehcnung']);
    expect(sliceHighlight(text, spans)).toEqual(['Rechnung']);
  });

  it('highlights Nordwind in title when query is Nordwind', () => {
    const text = 'Rechnung Nordwind GmbH';
    const spans = highlightFuzzyMatches(text, ['nordwind']);
    expect(sliceHighlight(text, spans)).toEqual(['Nordwind']);
  });

  it('highlights Nordwind typo query on second title token', () => {
    const text = 'Kontoauszug Nordwind';
    const spans = highlightFuzzyMatches(text, ['nordwnd']);
    expect(sliceHighlight(text, spans)).toEqual(['Nordwind']);
  });

  it('does not highlight unrelated first token when query matches later token', () => {
    const text = 'Rechnung Nordwind GmbH';
    const spans = highlightFuzzyMatches(text, ['nordwind']);
    expect(sliceHighlight(text, spans)).not.toContain('Rechnung');
  });

  it('highlights umlaut words from ASCII query spellings', () => {
    const geb = highlightFuzzyMatches('Monatliche Gebühr', ['gebuhr']);
    expect(sliceHighlight('Monatliche Gebühr', geb)).toEqual(['Gebühr']);
    const mueller = highlightFuzzyMatches('Firma Müller AG', ['muller']);
    expect(sliceHighlight('Firma Müller AG', mueller)).toEqual(['Müller']);
  });

  it('uses expanded vocabulary terms for highlighting', () => {
    const text = 'Rechnung Nordwind GmbH';
    const terms = buildHighlightTerms(['nordwnd'], ['Nordwind']);
    const spans = highlightFuzzyMatches(text, terms);
    expect(sliceHighlight(text, spans)).toEqual(['Nordwind']);
  });

  it('matches normalized umlaut spellings', () => {
    expect(fuzzyWordMatch('ueberweisung', 'Überweisung')).toBe(true);
    expect(fuzzyWordMatch('strasse', 'Straße')).toBe(true);
  });
});
