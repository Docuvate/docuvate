import { describe, expect, it } from 'vitest';
import { fuzzyMatchScore } from './fuzzyScore';

describe('fuzzyMatchScore', () => {
  it('scores typo-tolerant registry matches', () => {
    expect(fuzzyMatchScore('dunkelmodus', 'Dunkelmodus')).toBeGreaterThan(0.9);
    expect(fuzzyMatchScore('erkannte felder', 'Erkannte Felder')).toBeGreaterThan(0.55);
    expect(fuzzyMatchScore('blockirte labels', 'Blockierte Labels')).toBeGreaterThan(0.45);
  });

  it('normalizes German umlaut spellings', () => {
    expect(fuzzyMatchScore('ueber', 'Über')).toBeGreaterThan(0.9);
  });
});
