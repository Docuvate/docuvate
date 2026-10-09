// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

export interface RankedChunkRow {
  chunk: CitedChatChunkCandidate;
  score: number;
}

/**
 * Spreads library retrieval across documents so multi-part questions can cite more than one doc.
 * First pass: at most one chunk per document; second pass: fill remaining slots by score.
 */
export function diversifyLibraryRerank(ranked: RankedChunkRow[], topK: number): RankedChunkRow[] {
  if (ranked.length === 0 || topK <= 0) {
    return [];
  }
  const selected: RankedChunkRow[] = [];
  const seenChunk = new Set<string>();
  const perDoc = new Map<string, number>();

  for (const row of ranked) {
    if (selected.length >= topK) {
      break;
    }
    if (seenChunk.has(row.chunk.chunkId)) {
      continue;
    }
    const docCount = perDoc.get(row.chunk.documentId) ?? 0;
    if (docCount >= 1) {
      continue;
    }
    selected.push(row);
    seenChunk.add(row.chunk.chunkId);
    perDoc.set(row.chunk.documentId, docCount + 1);
  }

  for (const row of ranked) {
    if (selected.length >= topK) {
      break;
    }
    if (seenChunk.has(row.chunk.chunkId)) {
      continue;
    }
    selected.push(row);
    seenChunk.add(row.chunk.chunkId);
  }

  return selected;
}
