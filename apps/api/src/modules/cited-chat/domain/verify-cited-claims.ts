import type { CitedClaimJson } from './cited-answer-json.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { bestQuoteMatchScore, resolveQuoteInChunk } from './verify-citation-quote.js';

export type CitedClaimRejectReason =
  | 'unknown_source'
  | 'empty_claim_text'
  | 'quote_not_in_chunk';

export interface RejectedCitedClaim {
  claimText: string;
  quote: string;
  bestMatchScore: number;
  reason: CitedClaimRejectReason;
  source: string;
}

export interface VerifiedCitedClaim {
  ordinal: number;
  text: string;
  chunkId: string;
  quote: string;
  charStart: number;
  charEnd: number;
}

export function normalizeCitedSourceLabel(
  raw: string,
  labels: ReadonlySet<string>
): string | null {
  const trimmed = raw.trim();
  if (labels.has(trimmed)) {
    return trimmed;
  }
  const upper = trimmed.toUpperCase();
  if (labels.has(upper)) {
    return upper;
  }
  const fromPattern = trimmed.match(/\bS\s*(\d+)\b/i);
  if (fromPattern) {
    const label = `S${fromPattern[1]}`;
    if (labels.has(label)) {
      return label;
    }
  }
  if (/^\d+$/.test(trimmed)) {
    const label = `S${trimmed}`;
    if (labels.has(label)) {
      return label;
    }
  }
  return null;
}

export function verifyCitedClaims(input: {
  claims: CitedClaimJson[];
  top: Array<{ chunk: CitedChatChunkCandidate }>;
  labelByChunk: Map<string, string>;
}): { verified: VerifiedCitedClaim[]; rejected: RejectedCitedClaim[] } {
  const labels = new Set(input.labelByChunk.values());
  const verified: VerifiedCitedClaim[] = [];
  const rejected: RejectedCitedClaim[] = [];
  let ordinal = 1;

  for (const claim of input.claims) {
    const claimText = claim.text.trim();
    const quote = claim.quote.trim();
    const sourceLabel = normalizeCitedSourceLabel(claim.source, labels);
    if (!sourceLabel) {
      rejected.push({
        claimText,
        quote,
        bestMatchScore: 0,
        reason: 'unknown_source',
        source: claim.source,
      });
      continue;
    }
    const chunkRow = input.top.find(
      (row) => input.labelByChunk.get(row.chunk.chunkId) === sourceLabel
    );
    if (!chunkRow) {
      rejected.push({
        claimText,
        quote,
        bestMatchScore: 0,
        reason: 'unknown_source',
        source: claim.source,
      });
      continue;
    }
    if (!claimText) {
      rejected.push({
        claimText,
        quote,
        bestMatchScore: bestQuoteMatchScore(chunkRow.chunk.body, quote),
        reason: 'empty_claim_text',
        source: claim.source,
      });
      continue;
    }

    const match = resolveQuoteInChunk(chunkRow.chunk.body, quote, { claimText });
    if (!match) {
      rejected.push({
        claimText,
        quote,
        bestMatchScore: bestQuoteMatchScore(chunkRow.chunk.body, quote),
        reason: 'quote_not_in_chunk',
        source: claim.source,
      });
      continue;
    }

    verified.push({
      ordinal,
      text: claimText,
      chunkId: chunkRow.chunk.chunkId,
      quote: match.bodyQuote,
      charStart: (chunkRow.chunk.charStart ?? 0) + match.charStart,
      charEnd: (chunkRow.chunk.charStart ?? 0) + match.charEnd,
    });
    ordinal += 1;
  }

  return { verified, rejected };
}
