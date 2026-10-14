// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { tokenizeSearchQuery } from '../../search/domain/normalize-search-text.js';

const MONTH_TO_PADDED: Readonly<Record<string, string>> = {
  january: '01',
  januar: '01',
  february: '02',
  februar: '02',
  march: '03',
  maerz: '03',
  märz: '03',
  april: '04',
  may: '05',
  mai: '05',
  june: '06',
  juni: '06',
  july: '07',
  juli: '07',
  august: '08',
  september: '09',
  october: '10',
  oktober: '10',
  november: '11',
  december: '12',
  dezember: '12',
};

/** Tokens for ILIKE library supplement (month names → numeric forms on payslips/invoices). */
export function libraryContextSearchTokens(query: string): string[] {
  const raw = tokenizeSearchQuery(query);
  const tokens = raw.filter((token) => token.length >= 3 || /^20\d{2}$/.test(token));
  const expanded = new Set(tokens);
  const year = raw.find((token) => /^20\d{2}$/.test(token));
  for (const token of raw) {
    const month = MONTH_TO_PADDED[token];
    if (!month) {
      continue;
    }
    expanded.add(month);
    if (year) {
      expanded.add(`${month}/${year}`);
      expanded.add(`${year}-${month}`);
    }
  }
  return [...expanded];
}
