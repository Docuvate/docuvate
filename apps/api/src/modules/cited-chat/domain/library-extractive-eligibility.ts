// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import type { ChatAnswerType } from './chat-answer-type-prototypes.schema.js';

export interface RankedChunkRow {
  chunk: CitedChatChunkCandidate;
  score: number;
}

/** Clear winner when the leading document's best rerank score beats the runner-up by this ratio. */
const LIBRARY_EXTRACTIVE_DOC_MARGIN = 1.06;
const LIBRARY_EXTRACTIVE_CHUNK_MARGIN = 1.06;

const SCOPED_FACT_MAX_DOCS = 5;

export function bestRowPerDocument(top: RankedChunkRow[]): RankedChunkRow[] {
  const byDoc = new Map<string, RankedChunkRow>();
  for (const row of top) {
    const existing = byDoc.get(row.chunk.documentId);
    if (!existing || row.score > existing.score) {
      byDoc.set(row.chunk.documentId, row);
    }
  }
  return [...byDoc.values()].sort((a, b) => b.score - a.score);
}

/**
 * Rows eligible for extractive fallback (LLM off or post-LLM failure only).
 * Disambiguates multi-document libraries via per-document rerank scores, not title-token heuristics.
 */
export function libraryExtractiveRows(top: RankedChunkRow[]): RankedChunkRow[] {
  if (top.length === 0) {
    return [];
  }
  const best = top[0];
  if (top.length === 1) {
    return [best];
  }

  const perDoc = bestRowPerDocument(top);
  if (perDoc.length >= 2) {
    const leader = perDoc[0];
    const runnerUp = perDoc[1];
    if (leader.score >= runnerUp.score * LIBRARY_EXTRACTIVE_DOC_MARGIN) {
      return [leader];
    }
    return [];
  }

  const runnerUp = top[1];
  if (runnerUp.chunk.documentId === best.chunk.documentId) {
    return [best];
  }
  if (best.score >= runnerUp.score * LIBRARY_EXTRACTIVE_CHUNK_MARGIN) {
    return [best];
  }
  return [];
}

/**
 * Amount/date library questions: pass several per-document leaders to worker extractive QA
 * (avoids empty pool when many similar documents score close, e.g. payroll libraries).
 */
export function libraryExtractiveRowsForScopedFact(
  top: RankedChunkRow[],
  answerType: ChatAnswerType
): RankedChunkRow[] {
  if (answerType !== 'amount' && answerType !== 'date') {
    return libraryExtractiveRows(top);
  }
  if (top.length === 0) {
    return [];
  }
  const perDoc = bestRowPerDocument(top);
  if (perDoc.length <= 1) {
    return perDoc;
  }
  const leader = perDoc[0];
  const runnerUp = perDoc[1];
  if (leader.score >= runnerUp.score * LIBRARY_EXTRACTIVE_DOC_MARGIN) {
    return [leader];
  }
  return perDoc.slice(0, SCOPED_FACT_MAX_DOCS);
}
