// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import {
  fuzzySpanSearchInChunk,
  type QuoteSpanMatch,
  truncateQuoteWords,
} from './verify-citation-quote.js';

function sentenceSpans(body: string): string[] {
  const parts = body.split(/(?<=[.!?])\s+|\n+/);
  return parts.map((part) => part.trim()).filter((part) => part.length >= 8);
}

function pickLongestNumericSentence(body: string): string | null {
  let best: string | null = null;
  for (const sentence of sentenceSpans(body)) {
    if (!/\d/.test(sentence)) {
      continue;
    }
    if (!best || sentence.length > best.length) {
      best = sentence;
    }
  }
  return best;
}

export function bestEvidenceSpanInChunk(chunkBody: string, query: string): QuoteSpanMatch | null {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 0) {
    const fromQuery = fuzzySpanSearchInChunk(chunkBody, trimmedQuery);
    if (fromQuery) {
      return fromQuery;
    }
  }
  const numericSentence = pickLongestNumericSentence(chunkBody);
  if (numericSentence) {
    const fromSentence = fuzzySpanSearchInChunk(chunkBody, numericSentence);
    if (fromSentence) {
      return fromSentence;
    }
  }
  const fallback = truncateQuoteWords(chunkBody, 24);
  if (!fallback) {
    return null;
  }
  const fromFallback = fuzzySpanSearchInChunk(chunkBody, fallback);
  return fromFallback;
}

export function buildRetrievalFallbackCitation(input: {
  chunk: CitedChatChunkCandidate;
  query: string;
  claimText: string;
}): {
  text: string;
  quote: string;
  charStart: number;
  charEnd: number;
} | null {
  const span =
    bestEvidenceSpanInChunk(input.chunk.body, input.query) ??
    bestEvidenceSpanInChunk(input.chunk.body, input.claimText);
  if (!span) {
    return null;
  }
  const charStart = (input.chunk.charStart ?? 0) + span.charStart;
  const charEnd = (input.chunk.charStart ?? 0) + span.charEnd;
  const text = input.claimText.trim() || span.bodyQuote.trim();
  if (!text) {
    return null;
  }
  return {
    text,
    quote: span.bodyQuote,
    charStart,
    charEnd,
  };
}
