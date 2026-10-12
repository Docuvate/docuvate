// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

export interface RankedChunkRow {
  chunk: CitedChatChunkCandidate;
  score: number;
}

const QUERY_HINT_STOPWORDS = new Set([
  'auch',
  'bis',
  'das',
  'dem',
  'den',
  'der',
  'die',
  'ein',
  'eine',
  'einer',
  'eines',
  'für',
  'haben',
  'hat',
  'hoch',
  'ich',
  'im',
  'in',
  'ist',
  'mein',
  'meine',
  'meinen',
  'mich',
  'mit',
  'nicht',
  'noch',
  'nur',
  'oder',
  'sehr',
  'sind',
  'und',
  'viel',
  'viele',
  'von',
  'warum',
  'was',
  'welche',
  'welcher',
  'welches',
  'wann',
  'wer',
  'wie',
  'wo',
  'zu',
]);

function queryHintTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 4 && !QUERY_HINT_STOPWORDS.has(token));
}

/** Prefer a title token that matches few ranked documents (e.g. "lindenweg" vs "mietvertrag"). */
function pickDocumentAnchorToken(top: RankedChunkRow[], query: string): string | null {
  const tokens = queryHintTokens(query);
  if (tokens.length === 0) {
    return null;
  }
  let bestToken: string | null = null;
  let bestMatchCount = Number.POSITIVE_INFINITY;
  for (const token of tokens) {
    const matchCount = top.filter((row) =>
      row.chunk.documentTitle.toLowerCase().includes(token)
    ).length;
    if (matchCount === 0) {
      continue;
    }
    if (matchCount < bestMatchCount) {
      bestMatchCount = matchCount;
      bestToken = token;
    }
  }
  return bestToken;
}

function rowsAnchoredByQuery(top: RankedChunkRow[], query: string): RankedChunkRow[] {
  const anchor = pickDocumentAnchorToken(top, query);
  if (!anchor) {
    return [];
  }
  const matched = top.filter((row) => row.chunk.documentTitle.toLowerCase().includes(anchor));
  return matched.length > 0 ? [matched[0]] : [];
}

/**
 * Library fast path: answer from the single best chunk when it clearly wins.
 * Multi-document questions (similar top scores across docs) fall through to the LLM,
 * unless the query names a document (title token) present in the rerank list.
 */
export function libraryExtractiveRows(top: RankedChunkRow[], query?: string): RankedChunkRow[] {
  if (top.length === 0) {
    return [];
  }
  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    const anchored = rowsAnchoredByQuery(top, trimmedQuery);
    if (anchored.length > 0) {
      return anchored;
    }
  }
  const best = top[0];
  if (top.length === 1) {
    return [best];
  }
  const runnerUp = top[1];
  if (runnerUp.chunk.documentId === best.chunk.documentId) {
    return [best];
  }
  if (best.score >= runnerUp.score * 1.06) {
    return [best];
  }
  return [];
}
