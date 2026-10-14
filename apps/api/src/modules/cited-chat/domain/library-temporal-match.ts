// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';

export interface GermanPeriodHint {
  month: number | null;
  year: number | null;
}

export const GERMAN_MONTH_BY_NAME: Readonly<Record<string, number>> = {
  januar: 1,
  februar: 2,
  maerz: 3,
  marz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

/** Month/year cues from German library questions (Entgeltnachweis Oktober 2024, 2024_10.pdf, …). */
export function extractGermanPeriodHints(query: string): GermanPeriodHint[] {
  const normalized = normalizeSearchText(query);
  const hints: GermanPeriodHint[] = [];

  const monthYear = /\b(januar|februar|maerz|marz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+(20\d{2})\b/g;
  for (const match of normalized.matchAll(monthYear)) {
    const monthToken = match[1];
    const yearToken = match[2];
    if (!monthToken || !yearToken) continue;
    const month = GERMAN_MONTH_BY_NAME[monthToken] ?? null;
    const year = Number.parseInt(yearToken, 10);
    hints.push({ month, year: Number.isFinite(year) ? year : null });
  }

  const numericMonthYear = /\b(20\d{2})[_/-](0?[1-9]|1[0-2])\b/g;
  for (const match of normalized.matchAll(numericMonthYear)) {
    const yearToken = match[1];
    const monthToken = match[2];
    if (!yearToken || !monthToken) continue;
    const year = Number.parseInt(yearToken, 10);
    const month = Number.parseInt(monthToken, 10);
    hints.push({
      month: Number.isFinite(month) ? month : null,
      year: Number.isFinite(year) ? year : null,
    });
  }

  const yearOnly = /\b(20\d{2})\b/g;
  for (const match of normalized.matchAll(yearOnly)) {
    const yearToken = match[1];
    if (!yearToken) continue;
    const year = Number.parseInt(yearToken, 10);
    if (Number.isFinite(year)) {
      hints.push({ month: null, year });
    }
  }

  const dedup = new Map<string, GermanPeriodHint>();
  for (const hint of hints) {
    dedup.set(`${String(hint.month)}:${String(hint.year)}`, hint);
  }
  return [...dedup.values()];
}

function monthYearInText(text: string, hint: GermanPeriodHint): boolean {
  const normalized = normalizeSearchText(text);
  if (hint.month == null) {
    if (hint.year == null) {
      return false;
    }
    return normalized.includes(String(hint.year));
  }
  if (hint.year != null) {
    const yearPatterns = [String(hint.year), String(hint.year).slice(2)];
    const hasYear = yearPatterns.some((part) => normalized.includes(part));
    if (!hasYear) {
      return false;
    }
  }
  const monthPadded = String(hint.month).padStart(2, '0');
  const monthNames = Object.entries(GERMAN_MONTH_BY_NAME)
    .filter(([, value]) => value === hint.month)
    .map(([name]) => name);
  if (monthNames.some((name) => normalized.includes(name))) {
    return true;
  }
  const numericPatterns = [
    new RegExp(`(^|[^0-9])${monthPadded}([/_-]|[^0-9]|$)`),
    new RegExp(`(^|[^0-9])${String(hint.month)}\\/20\\d{2}([^0-9]|$)`),
    new RegExp(`20\\d{2}${monthPadded}([^0-9]|$)`),
    new RegExp(`20\\d{2}_${monthPadded}([^0-9]|$)`),
    new RegExp(`20\\d{2}-${monthPadded}-`),
  ];
  return numericPatterns.some((pattern) => pattern.test(normalized));
}

/** Score boost when document metadata or chunk text matches period hints from the query. */
export function libraryTemporalMatchBoost(input: {
  query: string;
  filename: string;
  title: string;
  body: string;
  documentDate: string | null;
}): number {
  const hints = extractGermanPeriodHints(input.query);
  if (hints.length === 0) {
    return 0;
  }
  const monthSpecific = hints.filter((hint) => hint.month != null);
  const effectiveHints = monthSpecific.length > 0 ? monthSpecific : hints;
  const corpus = [input.filename, input.title, input.body, input.documentDate ?? ''].join('\n');
  let best = 0;
  for (const hint of effectiveHints) {
    if (monthYearInText(corpus, hint)) {
      const weight = hint.month != null && hint.year != null ? 0.35 : 0.15;
      best = Math.max(best, weight);
    }
  }
  return best;
}
