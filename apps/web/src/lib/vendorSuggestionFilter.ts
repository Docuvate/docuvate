// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const COMPANY_SUFFIX =
  /\b(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.?|GmbH\s*&\s*Co\.?)\b/i;
const BANNER_LINE = /synthetic layout regression document/i;
const HEADING_VENDOR =
  /^(?:QUERFORMAT[\s\-A-Z0-9]*FIXTURE|VERTRAGSUEBERSICHT|ANHANG\s+PREISLISTE)/i;
const PAPER_TITLE_EXACT = 'Closed-Form Document Layout Classification';

/** Mirrors worker heuristic vendor guards for stale DB rows. */
export function isPlausibleVendorSuggestion(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (BANNER_LINE.test(trimmed)) {
    return false;
  }
  if (HEADING_VENDOR.test(trimmed)) {
    return false;
  }
  if (trimmed === PAPER_TITLE_EXACT || trimmed.startsWith(`${PAPER_TITLE_EXACT} `)) {
    return false;
  }
  const letters = trimmed.replace(/[^A-Za-zÄÖÜäöüß]/gu, '');
  if (letters.length >= 12) {
    const upperRatio =
      letters.split('').filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length /
      letters.length;
    if (upperRatio > 0.82 && !COMPANY_SUFFIX.test(trimmed)) {
      return false;
    }
  }
  const words = trimmed.split(/\s+/u);
  if (words.length >= 6 && !COMPANY_SUFFIX.test(trimmed)) {
    const titleCase = words.filter((w) => w.length > 2 && w[0] === w[0]?.toUpperCase()).length;
    if (titleCase >= Math.max(4, words.length - 2)) {
      return false;
    }
  }
  return true;
}
