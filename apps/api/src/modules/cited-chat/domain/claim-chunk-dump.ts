// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeForQuoteMatch } from './verify-citation-quote.js';

const CHUNK_DUMP_MIN_LEN = 160;

/** True when the model echoed an index passage (`Title: body`) instead of an answer sentence. */
export function isIndexPassageClaim(claimText: string): boolean {
  const claim = claimText.trim();
  const colon = claim.indexOf(':');
  if (colon < 3 || colon > 120) {
    return false;
  }
  const title = claim.slice(0, colon).trim();
  const rest = claim.slice(colon + 1).trim();
  if (!title || rest.length < 8) {
    return false;
  }
  const titleNorm = title.toLowerCase();
  const restNorm = rest.toLowerCase();
  return restNorm.startsWith(titleNorm) || restNorm.includes(titleNorm);
}

/** True when the LLM echoed a long passage instead of composing a short claim. */
export function isChunkDumpClaim(claimText: string, quote: string): boolean {
  const claim = claimText.trim();
  const q = quote.trim();
  if (!claim || !q) {
    return false;
  }
  const claimNorm = normalizeForQuoteMatch(claim);
  const quoteNorm = normalizeForQuoteMatch(q);
  if (!quoteNorm) {
    return false;
  }
  return (
    claim.length >= CHUNK_DUMP_MIN_LEN &&
    claimNorm.includes(quoteNorm) &&
    quoteNorm.length >= 6
  );
}
