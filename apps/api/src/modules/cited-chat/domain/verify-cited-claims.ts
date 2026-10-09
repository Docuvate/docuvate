// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedClaimCitationJson, CitedClaimJson } from './cited-answer-json.js';
import type { CitedChatChunkCandidate } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import {
  bestQuoteMatchScore,
  findQuoteInChunk,
  fuzzySpanSearchInChunk,
  resolveQuoteInCandidateChunk,
  validateMatchedSpanNumbers,
} from './verify-citation-quote.js';

export type CitedClaimRejectReason =
  | 'unknown_source'
  | 'empty_claim_text'
  | 'quote_not_in_chunk'
  | 'claim_number_not_in_quote'
  | 'quote_in_other_document';

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

export function expandClaimCitations(claim: CitedClaimJson): CitedClaimCitationJson[] {
  if (Array.isArray(claim.citations) && claim.citations.length > 0) {
    return claim.citations.map((c) => ({
      source: String(c.source ?? '').trim(),
      quote: String(c.quote ?? '').trim(),
    }));
  }
  return [
    {
      source: String(claim.source ?? '').trim(),
      quote: String(claim.quote ?? '').trim(),
    },
  ];
}

type TopRow = { chunk: CitedChatChunkCandidate };

type CitationRowResolve =
  | { ok: true; row: TopRow }
  | { ok: false; reason: CitedClaimRejectReason };

function rowForSourceLabel(
  top: TopRow[],
  labelByChunk: Map<string, string>,
  sourceLabel: string
): TopRow | undefined {
  return top.find((row) => labelByChunk.get(row.chunk.chunkId) === sourceLabel);
}

function rowsMatchingQuote(top: TopRow[], quote: string): TopRow[] {
  return top.filter(
    (row) => resolveQuoteInCandidateChunk(row.chunk, quote, { claimText: '' }) != null
  );
}

function resolveCitationRow(
  top: TopRow[],
  labelByChunk: Map<string, string>,
  sourceLabel: string,
  quote: string
): CitationRowResolve {
  const labeled = rowForSourceLabel(top, labelByChunk, sourceLabel);
  if (!labeled) {
    return { ok: false, reason: 'unknown_source' };
  }
  if (resolveQuoteInCandidateChunk(labeled.chunk, quote, { claimText: '' })) {
    return { ok: true, row: labeled };
  }

  const hits = rowsMatchingQuote(top, quote);
  const sameDoc = hits.filter((row) => row.chunk.documentId === labeled.chunk.documentId);
  if (sameDoc.length > 0) {
    return { ok: true, row: sameDoc[0] };
  }

  const otherDoc = hits.filter((row) => row.chunk.documentId !== labeled.chunk.documentId);
  if (otherDoc.length > 0) {
    return { ok: false, reason: 'quote_in_other_document' };
  }

  return { ok: true, row: labeled };
}

function rejectReasonForQuote(
  chunkBody: string,
  quote: string,
  claimText: string
): CitedClaimRejectReason {
  const spanHit = findQuoteInChunk(chunkBody, quote) ?? fuzzySpanSearchInChunk(chunkBody, quote);
  if (
    spanHit &&
    !validateMatchedSpanNumbers({
      quote,
      claimText,
      bodyQuote: spanHit.bodyQuote,
      chunkBody,
    })
  ) {
    return 'claim_number_not_in_quote';
  }
  return 'quote_not_in_chunk';
}

export function verifyCitedClaims(input: {
  claims: CitedClaimJson[];
  top: TopRow[];
  labelByChunk: Map<string, string>;
}): { verified: VerifiedCitedClaim[]; rejected: RejectedCitedClaim[] } {
  const labels = new Set(input.labelByChunk.values());
  const verified: VerifiedCitedClaim[] = [];
  const rejected: RejectedCitedClaim[] = [];
  let ordinal = 1;

  for (const claim of input.claims) {
    const claimText = claim.text.trim();
    const citations = expandClaimCitations(claim);
    const primaryQuote = citations[0]?.quote ?? '';
    const primarySource = citations[0]?.source ?? claim.source ?? '';

    if (!claimText) {
      rejected.push({
        claimText,
        quote: primaryQuote,
        bestMatchScore: 0,
        reason: 'empty_claim_text',
        source: primarySource,
      });
      continue;
    }

    if (citations.some((c) => !c.quote)) {
      rejected.push({
        claimText,
        quote: primaryQuote,
        bestMatchScore: 0,
        reason: 'quote_not_in_chunk',
        source: primarySource,
      });
      continue;
    }

    const resolved: Array<{
      row: TopRow;
      match: NonNullable<ReturnType<typeof resolveQuoteInCandidateChunk>>;
      quote: string;
    }> = [];

    const claimTextForQuoteMatch = citations.length === 1 ? claimText : '';

    for (const citation of citations) {
      if (!citation.source) {
        rejected.push({
          claimText,
          quote: citation.quote,
          bestMatchScore: 0,
          reason: 'unknown_source',
          source: '',
        });
        resolved.length = 0;
        break;
      }
      const sourceLabel = normalizeCitedSourceLabel(citation.source, labels);
      if (!sourceLabel) {
        rejected.push({
          claimText,
          quote: citation.quote,
          bestMatchScore: 0,
          reason: 'unknown_source',
          source: citation.source,
        });
        resolved.length = 0;
        break;
      }

      const rowResult = resolveCitationRow(
        input.top,
        input.labelByChunk,
        sourceLabel,
        citation.quote
      );
      if (!rowResult.ok) {
        rejected.push({
          claimText,
          quote: citation.quote,
          bestMatchScore: 0,
          reason: rowResult.reason,
          source: citation.source || sourceLabel || '',
        });
        resolved.length = 0;
        break;
      }
      const row = rowResult.row;

      const match = resolveQuoteInCandidateChunk(row.chunk, citation.quote, {
        claimText: claimTextForQuoteMatch,
      });
      if (!match) {
        rejected.push({
          claimText,
          quote: citation.quote,
          bestMatchScore: bestQuoteMatchScore(row.chunk.body, citation.quote),
          reason: rejectReasonForQuote(row.chunk.body, citation.quote, claimText),
          source: citation.source || sourceLabel || '',
        });
        resolved.length = 0;
        break;
      }

      if (
        !validateMatchedSpanNumbers({
          quote: citation.quote,
          claimText: '',
          bodyQuote: match.bodyQuote,
          chunkBody: row.chunk.body,
        })
      ) {
        rejected.push({
          claimText,
          quote: citation.quote,
          bestMatchScore: bestQuoteMatchScore(row.chunk.body, citation.quote),
          reason: 'claim_number_not_in_quote',
          source: citation.source || sourceLabel || '',
        });
        resolved.length = 0;
        break;
      }

      resolved.push({ row, match, quote: citation.quote });
    }

    if (resolved.length === 0) {
      continue;
    }

    const unionQuote = resolved.map((r) => r.match.bodyQuote).join(' ');
    const unionChunkBodies = resolved.map((r) => r.row.chunk.body).join(' ');
    if (
      !validateMatchedSpanNumbers({
        quote: unionQuote,
        claimText,
        bodyQuote: unionQuote,
        chunkBody: unionChunkBodies,
      })
    ) {
      rejected.push({
        claimText,
        quote: primaryQuote,
        bestMatchScore: bestQuoteMatchScore(resolved[0].row.chunk.body, primaryQuote),
        reason: 'claim_number_not_in_quote',
        source: primarySource,
      });
      continue;
    }

    for (const row of resolved) {
      verified.push({
        ordinal,
        text: claimText,
        chunkId: row.row.chunk.chunkId,
        quote: row.match.bodyQuote,
        charStart: (row.row.chunk.charStart ?? 0) + row.match.charStart,
        charEnd: (row.row.chunk.charStart ?? 0) + row.match.charEnd,
      });
    }
    ordinal += 1;
  }

  return { verified, rejected };
}
