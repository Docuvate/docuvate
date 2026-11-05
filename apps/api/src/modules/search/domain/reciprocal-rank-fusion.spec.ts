// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { idsByFusedScore, reciprocalRankFusion } from './reciprocal-rank-fusion.js';
import { SEARCH_LEG_WEIGHTS } from './search-leg-weights.js';

describe('reciprocalRankFusion', () => {
  it('merges lists with shared ids scoring higher', () => {
    const scores = reciprocalRankFusion([
      {
        weight: 1,
        items: [
          { id: 'a', rank: 1 },
          { id: 'b', rank: 2 },
        ],
      },
      {
        weight: 1,
        items: [
          { id: 'b', rank: 1 },
          { id: 'c', rank: 2 },
        ],
      },
    ]);
    expect(idsByFusedScore(scores)).toEqual(['b', 'a', 'c']);
  });

  it('scales each list by its weight', () => {
    const scores = reciprocalRankFusion([
      { weight: 1, items: [{ id: 'a', rank: 1 }] },
      { weight: 3, items: [{ id: 'b', rank: 5 }] },
    ]);
    expect(scores.get('a')).toBeCloseTo(1 / 61);
    expect(scores.get('b')).toBeCloseTo(3 / 65);
    expect(idsByFusedScore(scores)).toEqual(['b', 'a']);
  });
});

describe('SEARCH_LEG_WEIGHTS', () => {
  it('ranks an exact title match above a document that tops every other leg', () => {
    const w = SEARCH_LEG_WEIGHTS;
    const otherLegs = [
      w.titlePhrase,
      w.fullText,
      w.titleTrigram,
      w.chunkFullText,
      w.fieldValue,
      w.embedding,
    ];
    const scores = reciprocalRankFusion([
      { weight: w.exactTitle, items: [{ id: 'exact', rank: 1 }] },
      ...otherLegs.map((weight) => ({ weight, items: [{ id: 'other', rank: 1 }] })),
    ]);
    expect(idsByFusedScore(scores)[0]).toBe('exact');
  });
});
