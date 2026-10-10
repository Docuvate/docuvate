// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { diversifyLibraryRerank } from './diversify-reranked-chunks.js';

function row(documentId: string, score: number, chunkId?: string) {
  const chunk: CitedChatChunkCandidate = {
    chunkId: chunkId ?? `${documentId}-chunk`,
    documentId,
    documentTitle: documentId,
    body: 'body',
    page: 1,
    charStart: 0,
    charEnd: 4,
    fusionScore: score,
  };
  return { chunk, score };
}

describe('diversifyLibraryRerank', () => {
  it('prefers one chunk per document before filling', () => {
    const ranked = [
      row('d1', 0.9, 'a'),
      row('d1', 0.85, 'b'),
      row('d2', 0.8, 'c'),
      row('d3', 0.7, 'd'),
    ];
    const top = diversifyLibraryRerank(ranked, 3);
    const docs = new Set(top.map((t) => t.chunk.documentId));
    expect(docs.size).toBe(3);
  });
});
