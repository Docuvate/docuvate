// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

export interface RankedChunkRow {
  chunk: CitedChatChunkCandidate;
  score: number;
}

/**
 * Library fast path: answer from the single best chunk when it clearly wins.
 * Multi-document questions (similar top scores across docs) fall through to the LLM.
 */
export function libraryExtractiveRows(top: RankedChunkRow[]): RankedChunkRow[] {
  if (top.length === 0) {
    return [];
  }
  const best = top[0];
  if (top.length === 1) {
    return [best];
  }
  const runnerUp = top[1];
  if (runnerUp.chunk.documentId === best.chunk.documentId) {
    return [best];
  }
  if (best.score >= runnerUp.score * 1.12) {
    return [best];
  }
  return [];
}
