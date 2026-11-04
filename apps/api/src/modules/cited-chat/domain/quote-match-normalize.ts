// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Lower-case and strip quote marks/punctuation noise so quotes can be matched. */
export function normalizeForQuoteMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[„“"''`´]/g, '')
    .replace(/[:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse German/English number formatting so 1.234,56 and 1234.56 align for matching. */
export function normalizeNumbersForQuoteMatch(text: string): string {
  let out = normalizeForQuoteMatch(text);
  out = out.replace(
    /\b(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\b/g,
    (_match, intPart: string, frac?: string) => {
      const digits = intPart.replace(/\./g, '');
      return frac != null && frac !== '' ? `${digits}.${frac}` : digits;
    }
  );
  out = out.replace(/\b(\d+)\.(\d{1,2})\b/g, '$1.$2');
  return out.replace(/\s+/g, ' ').trim();
}
