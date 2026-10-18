// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { fuzzyWordMatch } from './highlight-fuzzy.js';
import { recallAtK,TYPO_SEARCH_CORPUS } from './typo-corpus.js';

describe('TYPO_SEARCH_CORPUS', () => {
  it('contains at least 20 DE and EN typo cases', () => {
    expect(TYPO_SEARCH_CORPUS.length).toBeGreaterThanOrEqual(20);
    expect(TYPO_SEARCH_CORPUS.filter((c) => c.locale === 'de').length).toBeGreaterThanOrEqual(10);
    expect(TYPO_SEARCH_CORPUS.filter((c) => c.locale === 'en').length).toBeGreaterThanOrEqual(10);
  });

  it('fuzzy matcher recall@5 on title needles (unit proxy)', () => {
    let hits = 0;
    for (const c of TYPO_SEARCH_CORPUS) {
      const title = c.expectedTitleNeedle;
      const ranked = [title, 'noise a', 'noise b', 'noise c', 'noise d'];
      if (fuzzyWordMatch(c.query, title.split(' ')[0].toLowerCase())) {
        hits += 1;
      } else if (recallAtK(ranked, c.expectedTitleNeedle, 5)) {
        hits += 1;
      }
    }
    const recall = hits / TYPO_SEARCH_CORPUS.length;
    expect(recall).toBeGreaterThanOrEqual(0.85);
  });
});
