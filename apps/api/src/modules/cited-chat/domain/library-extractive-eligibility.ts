// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

export interface RankedChunkRow {
  chunk: CitedChatChunkCandidate;
  score: number;
}

/** Fast extractive answers are safe when retrieval points at a single document. */
export function libraryExtractiveEligible(top: RankedChunkRow[]): boolean {
  if (top.length === 0) {
    return false;
  }
  const documentIds = new Set(top.map((row) => row.chunk.documentId));
  return documentIds.size === 1;
}
