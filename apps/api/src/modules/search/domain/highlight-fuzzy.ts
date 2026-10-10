// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SearchHighlightSpan } from '@docuvate/contracts';

import { damerauLevenshtein } from './damerau-levenshtein.js';
import { normalizeSearchText } from './normalize-search-text.js';

function fuzzyWordMatch(queryWord: string, candidate: string): boolean {
  if (!queryWord || !candidate) return false;
  if (candidate.includes(queryWord) || queryWord.includes(candidate)) return true;
  const nq = normalizeSearchText(queryWord);
  const nc = normalizeSearchText(candidate);
  if (nc.includes(nq) || nq.includes(nc)) return true;
  const maxLen = Math.max(nq.length, nc.length);
  if (maxLen <= 3) return nq === nc;
  const dist = damerauLevenshtein(nq, nc);
  const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : 3;
  return dist <= threshold;
}

function mergeSpans(spans: SearchHighlightSpan[]): SearchHighlightSpan[] {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: SearchHighlightSpan[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/** Highlight query tokens (including fuzzy / normalized matches) in plain text. */
export function highlightFuzzyMatches(text: string, queryWords: string[]): SearchHighlightSpan[] {
  if (!text || queryWords.length === 0) return [];
  const spans: SearchHighlightSpan[] = [];
  const wordRe = /[\p{L}\p{N}]+/gu;
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(text)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;
    for (const qw of queryWords) {
      if (fuzzyWordMatch(qw, word)) {
        spans.push({ start, end });
        break;
      }
    }
  }
  return mergeSpans(spans);
}

export function snippetAroundMatch(
  text: string,
  spans: SearchHighlightSpan[],
  maxLen = 160
): string {
  if (!text) return '';
  if (spans.length === 0) {
    return text.length <= maxLen ? text : `${text.slice(0, maxLen - 1)}…`;
  }
  const anchor = spans[0].start;
  const half = Math.floor(maxLen / 2);
  let start = Math.max(0, anchor - half);
  const end = Math.min(text.length, start + maxLen);
  if (end - start < maxLen) {
    start = Math.max(0, end - maxLen);
  }
  return text.slice(start, end);
}

/** Tokens used for highlighting (raw query + silent vocabulary expansion). */
export function buildHighlightTerms(queryTokens: string[], expandedTerms: string[]): string[] {
  const terms = [...queryTokens];
  for (const term of expandedTerms) {
    terms.push(...tokenizeFromQuery(term));
  }
  return [...new Set(terms.map((t) => t.toLowerCase()).filter((t) => t.length >= 2))];
}

function tokenizeFromQuery(query: string): string[] {
  const matches = query.match(/[\p{L}\p{N}]+/gu);
  return matches?.map((t) => t.toLowerCase()) ?? [];
}

export { damerauLevenshtein,fuzzyWordMatch };
