// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeForQuoteMatch } from './verify-citation-quote.js';

const CHUNK_DUMP_MIN_LEN = 160;

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
