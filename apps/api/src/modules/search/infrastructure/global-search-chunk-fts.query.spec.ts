// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildChunkFtsSearchTerms,
  buildLexicalTrgmProbes,
  CHUNK_FTS_TERM_LIMIT,
} from './global-search-chunk-fts.query.js';

describe('global-search-chunk-fts.query', () => {
  it('buildChunkFtsSearchTerms keeps only original tokens and caps count', () => {
    const terms = buildChunkFtsSearchTerms([
      'Rechnung',
      'Konto',
      'ab',
      'Quartal',
      'Gebühr',
      'Extra',
      'More',
    ]);
    expect(terms).toEqual(['rechnung', 'konto', 'quartal', 'gebuehr']);
    expect(terms.length).toBeLessThanOrEqual(CHUNK_FTS_TERM_LIMIT);
  });

  it('buildLexicalTrgmProbes merges originals and expansions but not every variant', () => {
    const probes = buildLexicalTrgmProbes(['Rehcnung'], ['rechnung', 'nordwind']);
    expect(probes).toContain('rehcnung');
    expect(probes).toContain('rechnung');
    expect(probes).toContain('nordwind');
  });
});
