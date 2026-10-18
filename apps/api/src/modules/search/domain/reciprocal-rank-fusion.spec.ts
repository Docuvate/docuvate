// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { reciprocalRankFusion } from './reciprocal-rank-fusion.js';

describe('reciprocalRankFusion', () => {
  it('merges lists with shared ids scoring higher', () => {
    const scores = reciprocalRankFusion([
      [
        { id: 'a', rank: 1 },
        { id: 'b', rank: 2 },
      ],
      [
        { id: 'b', rank: 1 },
        { id: 'c', rank: 2 },
      ],
    ]);
    const scoreB = scores.get('b');
    const scoreA = scores.get('a');
    const scoreC = scores.get('c');
    expect(scoreB).toBeDefined();
    expect(scoreA).toBeDefined();
    expect(scoreC).toBeDefined();
    if (scoreB === undefined || scoreA === undefined || scoreC === undefined) {
      throw new Error('expected fusion scores');
    }
    expect(scoreB).toBeGreaterThan(scoreA);
    expect(scoreB).toBeGreaterThan(scoreC);
  });
});
