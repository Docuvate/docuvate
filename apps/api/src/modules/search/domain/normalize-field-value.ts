// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from './normalize-search-text.js';

export type NormalizedFieldKind = 'text' | 'number' | 'currency' | 'date';

export interface NormalizedFieldValue {
  kind: NormalizedFieldKind;
  displayValue: string;
  textNorm: string | null;
  numeric: number | null;
  dateIso: string | null;
}

const MONTH_DE: Record<string, number> = {
  januar: 1,
  februar: 2,
  maerz: 3,
  märz: 3,
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

const MONTH_EN: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function parseGermanDate(text: string): string | null {
  const trimmed = text.trim();
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (dotted) {
    const d = Number(dotted[1]);
    const m = Number(dotted[2]);
    const y = Number(dotted[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y)}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const named = /^(\d{1,2})\.\s*([\p{L}]+)\s+(\d{4})$/u.exec(trimmed.toLowerCase());
  if (named) {
    const day = Number(named[1]);
    const monthWord = named[2].normalize('NFKC');
    const year = Number(named[3]);
    const month = MONTH_DE[monthWord] ?? MONTH_EN[monthWord];
    if (month && day >= 1 && day <= 31) {
      return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    return trimmed;
  }
  const enNamed = /^([\p{L}]+)\s+(\d{1,2}),?\s+(\d{4})$/u.exec(trimmed.toLowerCase());
  if (enNamed) {
    const monthWord = enNamed[1];
    const day = Number(enNamed[2]);
    const year = Number(enNamed[3]);
    const month = MONTH_EN[monthWord];
    if (month && day >= 1 && day <= 31) {
      return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseAmount(text: string): number | null {
  let s = text.trim();
  s = s.replace(/\s*(€|eur|euro|usd|\$|gbp|£)\s*/gi, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  const match = /(-?\d[\d.,]*)/.exec(s);
  if (!match) return null;
  let num = match[1];
  const hasComma = num.includes(',');
  const hasDot = num.includes('.');
  if (hasComma && hasDot) {
    if (num.lastIndexOf(',') > num.lastIndexOf('.')) {
      num = num.replace(/\./g, '').replace(',', '.');
    } else {
      num = num.replace(/,/g, '');
    }
  } else if (hasComma) {
    num = num.replace(',', '.');
  }
  const n = Number(num);
  return Number.isFinite(n) ? n : null;
}

/** Normalize extracted/custom field values for exact (number/date) and fuzzy (text) search legs. */
export function normalizeFieldValue(
  raw: string,
  fieldType: NormalizedFieldKind
): NormalizedFieldValue {
  const displayValue = raw.trim();
  if (!displayValue) {
    return { kind: fieldType, displayValue: '', textNorm: null, numeric: null, dateIso: null };
  }

  if (fieldType === 'date') {
    const dateIso = parseGermanDate(displayValue);
    return {
      kind: 'date',
      displayValue,
      textNorm: normalizeSearchText(displayValue),
      numeric: null,
      dateIso,
    };
  }

  if (fieldType === 'number' || fieldType === 'currency') {
    const numeric = parseAmount(displayValue);
    return {
      kind: fieldType,
      displayValue,
      textNorm: normalizeSearchText(displayValue),
      numeric,
      dateIso: null,
    };
  }

  return {
    kind: 'text',
    displayValue,
    textNorm: normalizeSearchText(displayValue),
    numeric: null,
    dateIso: null,
  };
}

/** Parse a user query token as amount or date for field-scoped / free-text legs. */
export function parseQueryScalarProbe(raw: string): {
  numeric: number | null;
  dateIso: string | null;
  textProbe: string;
} {
  const trimmed = raw.trim();
  const dateIso = parseGermanDate(trimmed);
  const numeric = parseAmount(trimmed);
  return {
    numeric,
    dateIso,
    textProbe: normalizeSearchText(trimmed),
  };
}
