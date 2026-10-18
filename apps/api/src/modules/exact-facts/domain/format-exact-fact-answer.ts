// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { ParsedExactFactQuery } from './exact-fact-query.types.js';
import type { ExactFactRow } from './exact-fact-row.js';

function formatAmountDe(amount: number, currencyCode: string | null): string {
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  if (currencyCode) {
    return `${formatted} ${currencyCode}`;
  }
  return formatted;
}

function formatAmountEn(amount: number, currencyCode: string | null): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  if (currencyCode) {
    return `${currencyCode} ${formatted}`;
  }
  return formatted;
}

function formatAmount(locale: 'de' | 'en', amount: number, currencyCode: string | null): string {
  return locale === 'en' ? formatAmountEn(amount, currencyCode) : formatAmountDe(amount, currencyCode);
}

function displayPredicate(row: ExactFactRow): string {
  return row.predicateKey.trim() || row.documentTitle;
}

function formatLookupAnswer(
  locale: 'de' | 'en',
  rows: ExactFactRow[]
): string | null {
  if (rows.length === 0) {
    return null;
  }
  if (rows.length === 1) {
    const row = rows[0];
    const label = displayPredicate(row);
    if (row.kind === 'amount' && row.amountNumeric != null) {
      const value = formatAmount(locale, row.amountNumeric, row.currencyCode);
      return locale === 'en'
        ? `**${label}:** ${value} [1]`
        : `**${label}:** ${value} [1]`;
    }
    if (row.kind === 'date' && row.valueDateIso) {
      return locale === 'en'
        ? `**${label}:** ${row.valueDateIso} [1]`
        : `**${label}:** ${row.valueDateIso} [1]`;
    }
    if (row.valueText) {
      return locale === 'en'
        ? `**${label}:** ${row.valueText} [1]`
        : `**${label}:** ${row.valueText} [1]`;
    }
  }

  const lines = rows.map((row, index) => {
    const ordinal = index + 1;
    const label = displayPredicate(row);
    if (row.kind === 'amount' && row.amountNumeric != null) {
      return `- **${label}** (${row.documentTitle}): ${formatAmount(locale, row.amountNumeric, row.currencyCode)} [${String(ordinal)}]`;
    }
    if (row.kind === 'date' && row.valueDateIso) {
      return `- **${label}** (${row.documentTitle}): ${row.valueDateIso} [${String(ordinal)}]`;
    }
    const text = row.valueText ?? '—';
    return `- **${label}** (${row.documentTitle}): ${text} [${String(ordinal)}]`;
  });
  return lines.join('\n');
}

function formatSumAnswer(
  locale: 'de' | 'en',
  sum: number,
  currencyCode: string | null,
  matchedCount: number
): string {
  const value = formatAmount(locale, sum, currencyCode);
  if (locale === 'en') {
    return `Total across **${String(matchedCount)}** matching amounts: **${value}**.`;
  }
  return `Summe über **${String(matchedCount)}** passende Beträge: **${value}**.`;
}

function formatCountAnswer(locale: 'de' | 'en', count: number, query: ParsedExactFactQuery): string {
  if (locale === 'en') {
    if (query.predicateTokens.length > 0) {
      return `**${String(count)}** matching facts in your library.`;
    }
    return `**${String(count)}** indexed facts in your library.`;
  }
  if (query.predicateTokens.length > 0) {
    return `**${String(count)}** passende Fakten in Ihrer Bibliothek.`;
  }
  return `**${String(count)}** indexierte Fakten in Ihrer Bibliothek.`;
}

export function formatExactFactAnswer(input: {
  locale: 'de' | 'en';
  query: ParsedExactFactQuery;
  lookupRows: ExactFactRow[];
  sumAmount: { total: number; currencyCode: string | null; factCount: number } | null;
  factCount: number | null;
}): string | null {
  switch (input.query.kind) {
    case 'lookup':
      return formatLookupAnswer(input.locale, input.lookupRows);
    case 'sum_amounts':
      if (!input.sumAmount) {
        return null;
      }
      return formatSumAnswer(
        input.locale,
        input.sumAmount.total,
        input.sumAmount.currencyCode,
        input.sumAmount.factCount
      );
    case 'count_facts':
      if (input.factCount == null) {
        return null;
      }
      return formatCountAnswer(input.locale, input.factCount, input.query);
    default: {
      const exhaustive: never = input.query.kind;
      throw new Error(String(exhaustive));
    }
  }
}
