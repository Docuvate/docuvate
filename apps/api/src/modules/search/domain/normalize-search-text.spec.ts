import { describe, expect, it } from 'vitest';
import { normalizeSearchText, searchTextVariants } from './normalize-search-text.js';

describe('normalizeSearchText', () => {
  it('folds German umlauts and eszett', () => {
    expect(normalizeSearchText('Über Straße')).toBe('ueber strasse');
    expect(normalizeSearchText('Größe')).toBe('groesse');
  });

  it('produces umlaut variants', () => {
    const variants = searchTextVariants('ueber');
    expect(variants).toContain('über');
  });
});
