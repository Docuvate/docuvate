// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeForQuoteMatch } from './verify-citation-quote.js';

const CHUNK_DUMP_MIN_LEN = 160;

function polishSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return '';
  }
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

/** Turn verified or extractive output into short prose (never a multi-sentence chunk dump). */
export function composeCitedClaimText(
  claimText: string,
  quote: string,
  options?: { question?: string }
): string {
  const claim = claimText.trim();
  const q = quote.trim();
  if (!claim && q) {
    return polishSentence(q);
  }
  if (!q) {
    return polishSentence(claim);
  }

  const claimNorm = normalizeForQuoteMatch(claim);
  const quoteNorm = normalizeForQuoteMatch(q);
  if (!quoteNorm) {
    return polishSentence(claim);
  }

  const looksLikeChunkDump =
    claim.length >= CHUNK_DUMP_MIN_LEN &&
    claimNorm.includes(quoteNorm) &&
    quoteNorm.length >= 6;
  const claimMostlyQuote =
    claimNorm === quoteNorm ||
    (claim.length <= q.length + 16 && claimNorm.includes(quoteNorm));

  if (looksLikeChunkDump || claimMostlyQuote) {
    return polishSentence(q);
  }

  if (claim.length <= 240 && claimNorm.includes(quoteNorm)) {
    return polishSentence(claim);
  }

  const question = options?.question?.trim() ?? '';
  if (question && claim.length > 240) {
    return polishSentence(q);
  }

  return polishSentence(claim);
}
