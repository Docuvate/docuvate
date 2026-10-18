// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const COMPANY_SUFFIX =
  /\b(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.?|GmbH\s*&\s*Co\.?)\b/i;

/** Mirrors worker `_is_heading_like_vendor` (generic title/heading guards only). */
export function isHeadingLikeVendorValue(value: string): boolean {
  const line = value.trim();
  if (!line) {
    return false;
  }
  const letters = line.replace(/[^A-Za-zÄÖÜäöüß]/gu, '');
  if (letters.length >= 12) {
    const upperRatio =
      letters.split('').filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length /
      letters.length;
    if (upperRatio > 0.82 && !COMPANY_SUFFIX.test(line)) {
      return true;
    }
  }
  const words = line.split(/\s+/u);
  if (words.length >= 6 && !COMPANY_SUFFIX.test(line)) {
    const titleCase = words.filter((w) => {
      if (w.length <= 2) {
        return false;
      }
      const first = w.charAt(0);
      return first === first.toUpperCase() && first !== first.toLowerCase();
    }).length;
    if (titleCase >= Math.max(4, words.length - 2)) {
      return true;
    }
  }
  return false;
}

/** False when a stored vendor suggestion is likely a document title, not a sender. */
export function isPlausibleVendorSuggestion(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return !isHeadingLikeVendorValue(trimmed);
}
