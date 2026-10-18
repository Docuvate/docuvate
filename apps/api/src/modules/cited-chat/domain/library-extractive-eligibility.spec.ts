// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  libraryExtractiveRows,
  libraryExtractiveRowsForScopedFact,
  type RankedChunkRow,
} from './library-extractive-eligibility.js';

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
  it('picks the leading document when rerank scores separate clearly', () => {
    const top = [
      row('doc-a', 'Mietvertrag Wohnung', 0.9),
      row('doc-b', 'Mietvertrag Lindenweg', 0.5),
    ];
    const picked = libraryExtractiveRows(top);
    expect(picked).toHaveLength(1);
    expect(picked[0].chunk.documentId).toBe('doc-a');
  });

  it('returns empty when multi-doc scores are close', () => {
    const top = [
      row('doc-a', 'Mietvertrag Wohnung', 0.9),
      row('doc-b', 'Kfz-Versicherung 2026', 0.88),
    ];
    expect(libraryExtractiveRows(top)).toEqual([]);
  });
});

describe('libraryExtractiveRowsForScopedFact', () => {
  it('returns per-document leaders for amount questions when scores are close', () => {
    const top = [
      row('doc-a', 'Entgeltnachweis 10/2024', 0.9),
      row('doc-b', 'Entgeltnachweis 09/2024', 0.88),
      row('doc-c', 'Entgeltnachweis 08/2024', 0.87),
    ];
    const picked = libraryExtractiveRowsForScopedFact(top, 'amount');
    expect(picked.length).toBeGreaterThan(1);
    expect(picked.map((entry) => entry.chunk.documentId)).toEqual(['doc-a', 'doc-b', 'doc-c']);
  });
});
