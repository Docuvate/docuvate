// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CitedChatDocumentContextMeta } from './cited-chat-structured-context.js';
import {
  libraryContextPeriodPatterns,
  libraryContextSearchTokens,
  libraryContextYearMonths,
} from './library-context-search-tokens.js';

function normalizeHay(meta: CitedChatDocumentContextMeta): string {
  return `${meta.filename}\n${meta.title}\n${meta.documentDate ?? ''}`.toLowerCase();
}

/** When the question names a month/year, keep only label-aligned docs that match that period. */
export function filterDocumentIdsByLibraryQueryPeriod(
  documentIds: readonly string[],
  query: string,
  metaByDoc: ReadonlyMap<string, CitedChatDocumentContextMeta>
): string[] {
  const periods = libraryContextYearMonths(query);
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
