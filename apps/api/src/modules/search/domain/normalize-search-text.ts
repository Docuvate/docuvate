// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Lowercase and fold common German umlaut / eszett spellings for fuzzy matching.
 * Postgres queries also apply `unaccent()` (contrib) for trigram/FTS legs.
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/** Search variants: original trimmed, lowercased, and German folding. */
export function searchTextVariants(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  const folded = normalizeSearchText(trimmed);
  const expandUmlauts = lower
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
    .replace(/ss/g, 'ß');
  const out = new Set<string>([trimmed, lower, folded]);
  if (expandUmlauts !== lower) {
    out.add(expandUmlauts);
  }
  return [...out].filter(Boolean);
}

/** Tokenize query words (Unicode letters including umlauts). */
export function tokenizeSearchQuery(query: string): string[] {
  const matches = query.match(/[\p{L}\p{N}]+/gu);
  return matches?.map((t) => t.toLowerCase()) ?? [];
}
