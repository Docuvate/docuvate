// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { de as chronoDe, en as chronoEn } from 'chrono-node';
import { isValid,parse as parseDate } from 'date-fns';
import { de as localeDe, enUS as localeEnUS } from 'date-fns/locale';

import { tokenizeSearchQuery } from '../../search/domain/normalize-search-text.js';

const MONTH_YEAR_FORMATS = ['MMMM yyyy', 'MMM yyyy', 'MM/yyyy', 'M/yyyy'] as const;

interface YearMonth {
  month: string;
  year: string;
}

function paddedMonth(date: Date): string {
  return String(date.getMonth() + 1).padStart(2, '0');
}

function paddedYear(date: Date): string {
  return String(date.getFullYear());
}

function periodKey(month: string, year: string): string {
  return `${year}-${month}`;
}

function parsePeriodKey(key: string): YearMonth {
  const [year, month] = key.split('-');
  return { month, year };
}

function addYearMonth(out: Set<string>, month: string, year: string): void {
  if (!/^20\d{2}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) {
    return;
  }
  out.add(periodKey(month, year));
}

function periodsFromChrono(query: string): Set<string> {
  const out = new Set<string>();
  const ref = new Date();
  for (const parsed of [...chronoDe.parse(query, ref), ...chronoEn.parse(query, ref)]) {
    const start = parsed.start;
    if (!start.isCertain('month') || !start.isCertain('year')) {
      continue;
    }
    const month = String(start.get('month')).padStart(2, '0');
    const year = String(start.get('year'));
    addYearMonth(out, month, year);
  }
  return out;
}

/** date-fns + ICU month names (de/en) for phrases like "Oktober 2024" adjacent to a year token. */
function periodsFromLocalizedMonthYear(query: string): Set<string> {
  const out = new Set<string>();
  const raw = tokenizeSearchQuery(query);
  for (let i = 0; i < raw.length; i += 1) {
    const yearToken = raw[i];
    if (!/^20\d{2}$/.test(yearToken)) {
      continue;
    }
    const yearNum = Number(yearToken);
    for (let width = 1; width <= 3; width += 1) {
      const start = i - width;
      if (start < 0) {
        continue;
      }
      const phrase = [...raw.slice(start, i), yearToken].join(' ');
      for (const locale of [localeDe, localeEnUS] as const) {
        for (const fmt of MONTH_YEAR_FORMATS) {
          const parsed = parseDate(phrase, fmt, new Date(), { locale });
          if (!isValid(parsed) || parsed.getFullYear() !== yearNum) {
            continue;
          }
          addYearMonth(out, paddedMonth(parsed), paddedYear(parsed));
        }
      }
    }
  }
  return out;
}

function collectYearMonths(query: string): YearMonth[] {
  const merged = new Set<string>();
  for (const key of periodsFromChrono(query)) {
    merged.add(key);
  }
  for (const key of periodsFromLocalizedMonthYear(query)) {
    merged.add(key);
  }
  return [...merged].map(parsePeriodKey);
}

function yearMonthSearchTokens(periods: readonly YearMonth[]): string[] {
  const tokens: string[] = [];
  for (const { month, year } of periods) {
    tokens.push(`${month}/${year}`, `${year}-${month}`, `${year}_${month}`);
  }
  return tokens;
}

/** Calendar periods parsed from the user question (month/year). */
export function libraryContextYearMonths(query: string): YearMonth[] {
  return collectYearMonths(query);
}

/** Tokens for ILIKE library supplement (includes parsed month/year period forms). */
export function libraryContextSearchTokens(query: string): string[] {
  const raw = tokenizeSearchQuery(query);
  const tokens = raw.filter((token) => token.length >= 3 || /^20\d{2}$/.test(token));
  const expanded = new Set(tokens);
  for (const token of yearMonthSearchTokens(collectYearMonths(query))) {
    expanded.add(token);
  }
  return [...expanded];
}

/** Month/year ILIKE patterns when the query resolves to a calendar period. */
export function libraryContextPeriodPatterns(tokens: readonly string[]): string[] {
  const patterns: string[] = [];
  for (const token of tokens) {
    if (/^\d{2}\/20\d{2}$/.test(token)) {
      patterns.push(`%${token}%`, `%${token.replace('/', '_')}%`);
      continue;
    }
    if (/^20\d{2}-\d{2}$/.test(token)) {
      patterns.push(`%${token}%`, `%${token.replace('-', '_')}%`);
      continue;
    }
    if (/^20\d{2}_\d{2}$/.test(token)) {
      patterns.push(`%${token}%`);
    }
  }
  return patterns;
}
