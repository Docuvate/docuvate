// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type DocuvateLocale = 'de' | 'en';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function localizedDatePlaceholder(locale: DocuvateLocale): string {
  return locale === 'de' ? 'TT.MM.JJJJ' : 'MM/DD/YYYY';
}

export function isoDateToLocalizedDisplay(iso: string, locale: DocuvateLocale): string {
  const match = ISO_DATE.exec(iso.trim());
  if (!match) return iso;
  const [, y, m, d] = match;
  if (locale === 'de') {
    return `${d}.${m}.${y}`;
  }
  return `${m}/${d}/${y}`;
}

export function localizedDisplayToIsoDate(input: string, locale: DocuvateLocale): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (ISO_DATE.test(trimmed)) {
    return trimmed;
  }

  if (locale === 'de') {
    const deMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
    if (!deMatch) return null;
    const day = deMatch[1]!.padStart(2, '0');
    const month = deMatch[2]!.padStart(2, '0');
    const year = deMatch[3]!;
    return `${year}-${month}-${day}`;
  }

  const enMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!enMatch) return null;
  const month = enMatch[1]!.padStart(2, '0');
  const day = enMatch[2]!.padStart(2, '0');
  const year = enMatch[3]!;
  return `${year}-${month}-${day}`;
}
