// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { libraryExtractiveRows, type RankedChunkRow } from './library-extractive-eligibility.js';

function row(
  documentId: string,
  title: string,
  score: number,
  chunkId = `${documentId}-chunk`
): RankedChunkRow {
  return {
    score,
    chunk: {
      chunkId,
      documentId,
      documentTitle: title,
      body: 'body',
      page: 1,
      charStart: 0,
      charEnd: 4,
      fusionScore: score,
    },
  };
}

describe('libraryExtractiveRows', () => {
  it('anchors on a distinctive title token when top scores are ambiguous', () => {
    const top = [
      row('doc-a', 'Mietvertrag Wohnung', 0.9),
      row('doc-b', 'Mietvertrag Lindenweg', 0.89),
    ];
    const picked = libraryExtractiveRows(
      top,
      'Wie hoch ist die Miete im Mietvertrag Lindenweg?'
    );
    expect(picked).toHaveLength(1);
    expect(picked[0].chunk.documentId).toBe('doc-b');
  });

  it('returns empty when multi-doc scores are close and query has no anchor', () => {
    const top = [
      row('doc-a', 'Mietvertrag Wohnung', 0.9),
      row('doc-b', 'Kfz-Versicherung 2026', 0.88),
    ];
    expect(libraryExtractiveRows(top, 'Wie hoch ist die Miete?')).toEqual([]);
  });
});
