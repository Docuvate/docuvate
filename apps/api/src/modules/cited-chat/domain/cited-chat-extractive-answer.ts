// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { tokenizeSearchQuery } from '../../search/domain/normalize-search-text.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

function scoreSentence(sentence: string, tokens: string[]): number {
  const lower = sentence.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (lower.includes(token)) {
      hits += 1;
    }
  }
  return hits;
}

/** CPU-fast answer from the best passage when rerank/fusion confidence is high. */
export function tryExtractiveCitedAnswer(
  userMessage: string,
  ranked: { chunk: CitedChatChunkCandidate; score: number }[],
  minScore: number
): { text: string; chunk: CitedChatChunkCandidate; quote: string } | null {
  if (ranked.length === 0 || ranked[0].score < minScore) {
    return null;
  }
  const best = ranked[0];

  const tokens = tokenizeSearchQuery(userMessage).filter((t) => t.length >= 3);
  const body = best.chunk.body.trim();
  if (!body) {
    return null;
  }

  const sentences = body.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
  let quote = sentences[0] ?? body;
  if (tokens.length > 0 && sentences.length > 1) {
    let bestSentence = quote;
    let bestHits = scoreSentence(quote, tokens);
    for (const sentence of sentences) {
      const hits = scoreSentence(sentence, tokens);
      if (hits > bestHits) {
        bestHits = hits;
        bestSentence = sentence;
      }
    }
    if (bestHits > 0) {
      quote = bestSentence;
    }
  }

  if (tokens.length > 0 && scoreSentence(quote, tokens) === 0) {
    return null;
  }

  return {
    text: quote,
    chunk: best.chunk,
    quote,
  };
}
