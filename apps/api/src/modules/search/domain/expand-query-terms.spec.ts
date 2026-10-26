// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import {
  expandQueryTerms,
  MIN_QUERY_RELEVANCE_SCORE,
  MIN_VOCABULARY_SIMILARITY,
} from './expand-query-terms.js';

describe('expandQueryTerms', () => {
  it('does not expand nonsense tokens when neighbors are below similarity threshold', async () => {
    const lookup = vi.fn(async () => [
      { term: 'alpha', similarity: 0.3 },
      { term: 'beta', similarity: 0.35 },
    ]);
    const result = await expandQueryTerms('xyzqq', lookup);
    expect(result.expanded).toEqual(['xyzqq']);
    expect(result.queryRelevance).toBe(0);
    expect(lookup).toHaveBeenCalled();
  });

  it('accepts typo neighbors at edit distance 1 when tokens are at least 5 characters', async () => {
    const lookup = vi.fn(async () => [{ term: 'rechnung', similarity: 0.4 }]);
    const result = await expandQueryTerms('rechnug', lookup);
    expect(result.expanded).toContain('rechnung');
    expect(result.queryRelevance).toBeGreaterThanOrEqual(MIN_QUERY_RELEVANCE_SCORE);
  });

  it('rejects edit-distance expansion for short tokens', async () => {
    const lookup = vi.fn(async () => [{ term: 'abcx', similarity: 0.2 }]);
    const result = await expandQueryTerms('abcd', lookup);
    expect(result.expanded).not.toContain('abcx');
    expect(result.queryRelevance).toBe(0);
  });

  it('accepts high-similarity vocabulary neighbors', async () => {
    const lookup = vi.fn(async () => [{ term: 'kontoauszug', similarity: MIN_VOCABULARY_SIMILARITY }]);
    const result = await expandQueryTerms('kontoauzug', lookup);
    expect(result.expanded).toContain('kontoauszug');
    expect(result.queryRelevance).toBe(MIN_VOCABULARY_SIMILARITY);
  });
});
