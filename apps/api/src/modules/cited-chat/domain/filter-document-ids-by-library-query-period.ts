// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  normalizeSearchText,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';
import type { CitedChatDocumentContextMeta } from './cited-chat-structured-context.js';
import {
  libraryContextPeriodPatterns,
  libraryContextSearchTokens,
  libraryContextYearMonths,
} from './library-context-search-tokens.js';

function normalizeHay(meta: CitedChatDocumentContextMeta): string {
  return normalizeSearchText(
    [meta.filename, meta.title, meta.documentDate ?? '', ...meta.labels].join('\n')
  );
}

function anchorHay(meta: CitedChatDocumentContextMeta): string {
  return normalizeSearchText([meta.filename, meta.title, ...meta.labels].join('\n'));
}

function containsYearToken(hay: string, year: string): boolean {
  return new RegExp(`(?:^|[^0-9])${year}(?:[^0-9]|$)`).test(hay);
}

/** When the question names a month/year, keep only docs whose metadata matches that period. */
export function filterDocumentIdsByLibraryQueryPeriod(
  documentIds: readonly string[],
  query: string,
  metaByDoc: ReadonlyMap<string, CitedChatDocumentContextMeta>
): string[] {
  const periods = libraryContextYearMonths(query);
  const yearTokens = tokenizeSearchQuery(query).filter((token) => /^20\d{2}$/.test(token));
  if (periods.length === 0 && yearTokens.length === 1) {
    const year = yearTokens[0];
    const exactFilenameMatches = documentIds.filter(
      (id) => metaByDoc.get(id)?.filename === `${year}.pdf`
    );
    if (exactFilenameMatches.length > 0) {
      return exactFilenameMatches;
    }
  }
  if (periods.length === 0 && yearTokens.length > 0) {
    const anchorTokens = tokenizeSearchQuery(query)
      .map((token) => normalizeSearchText(token))
      .filter((token) => token.length >= 8 && !/^20\d{2}$/.test(token));
    return documentIds.filter((id) => {
      const meta = metaByDoc.get(id);
      if (!meta) {
        return false;
      }
      const hay = normalizeHay(meta);
      const anchors = anchorHay(meta);
      if (!yearTokens.some((year) => containsYearToken(hay, year))) {
        return false;
      }
      if (anchorTokens.length === 0) {
        return true;
      }
      return anchorTokens.some((token) => anchors.includes(token));
    });
  }
  if (periods.length === 0) {
    return [...documentIds];
  }
  const periodKeys = new Set(periods.map(({ month, year }) => `${year}-${month}`));
  const tokens = libraryContextSearchTokens(query);
  const patterns = libraryContextPeriodPatterns(tokens)
    .map((pattern) => pattern.replace(/%/g, '').toLowerCase())
    .filter((pattern) => pattern.length > 0);

  return documentIds.filter((id) => {
    const meta = metaByDoc.get(id);
    if (!meta) {
      return false;
    }
    const dateKey = meta.documentDate?.slice(0, 7);
    if (dateKey && periodKeys.has(dateKey)) {
      return true;
    }
    const hay = normalizeHay(meta);
    return patterns.some((pattern) => hay.includes(pattern));
  });
}
