// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface DuplicateDocumentSignals {
  documentId: string;
  filename: string;
  title: string;
  documentDateYear: number | null;
  extractedTextSample: string;
  pageCount: number | null;
}

export type DuplicateGateRejectionReason =
  | 'conflicting_reporting_years'
  | 'conflicting_key_amounts'
  | 'page_count_mismatch';

export interface DuplicateDetectionGateConfig {
  pageCountMinDifference: number;
  pageCountGateMaxSimilarity: number;
}

export interface EmbeddingDuplicateGateResult {
  accept: boolean;
  reason?: DuplicateGateRejectionReason;
}

const CALENDAR_YEAR_RE = /\b(19|20)\d{2}\b/g;
const DECEMBER_CLOSING_DATE_RE =
  /(?:31\s*\.\s*12\s*\.?|31\s*\.\s*Dez(?:ember)?)\s*\.?\s*((?:19|20)\d{2})/gi;
const MONTH_YEAR_RE =
  /\b(?:0?[1-9]|1[0-2])[\/.]((?:19|20)\d{2})\b|\b(?:Jan(?:uar)?|Feb(?:ruar)?|März|Apr(?:il)?|Mai|Jun(?:i)?|Jul(?:i)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Okt(?:ober)?|Nov(?:ember)?|Dez(?:ember)?)\s+((?:19|20)\d{2})\b/gi;
const EURO_AMOUNT_RE =
  /(?:€\s*)?(\d{1,3}(?:[.\s]\d{3})*,\d{2})(?:\s*€)?|\b(\d{1,3}(?:[.\s]\d{3})*,\d{2})\s*(?:EUR|€)\b/gi;
const TAX_ASSESSMENT_ID_RE =
  /\b(?:Aktenzeichen|AZ|Steuernummer|St\.?-Nr\.?|Identifikationsnummer|IdNr\.?)[:\s]*([A-Z0-9][A-Z0-9./-]{4,})\b/gi;

function yearsFromTextParts(parts: string[]): number[] {
  const years = new Set<number>();
  for (const part of parts) {
    for (const match of part.matchAll(CALENDAR_YEAR_RE)) {
      const year = Number(match[0]);
      if (year >= 1990 && year <= 2099) years.add(year);
    }
    for (const match of part.matchAll(DECEMBER_CLOSING_DATE_RE)) {
      const year = Number(match[1]);
      if (year >= 1990 && year <= 2099) years.add(year);
    }
    for (const match of part.matchAll(MONTH_YEAR_RE)) {
      const year = Number(match[1] ?? match[2]);
      if (year >= 1990 && year <= 2099) years.add(year);
    }
  }
  return [...years].sort((a, b) => a - b);
}

/**
 * Reporting / fiscal years from filename, title, and OCR — not upload metadata unless no
 * explicit period signal exists on that document.
 */
export function collectReportingYears(signals: DuplicateDocumentSignals): number[] {
  const textParts = [signals.filename, signals.title, signals.extractedTextSample];
  const explicit = yearsFromTextParts(textParts);
  if (explicit.length > 0) {
    return explicit;
  }
  if (signals.documentDateYear != null && signals.documentDateYear >= 1990) {
    return [signals.documentDateYear];
  }
  return [];
}

export function reportingYearsConflict(yearsA: number[], yearsB: number[]): boolean {
  if (yearsA.length === 0 || yearsB.length === 0) return false;
  const setB = new Set(yearsB);
  for (const year of yearsA) {
    if (setB.has(year)) return false;
  }
  return true;
}

function normalizeEuroAmount(raw: string): string {
  const digits = raw.replace(/[^\d,]/g, '');
  const comma = digits.lastIndexOf(',');
  if (comma < 0) return digits;
  const euros = digits.slice(0, comma).replace(/\D/g, '');
  const cents = digits.slice(comma + 1).padEnd(2, '0').slice(0, 2);
  return `${euros}.${cents}`;
}

export function collectKeyEuroAmounts(signals: DuplicateDocumentSignals): string[] {
  const amounts = new Set<string>();
  const text = `${signals.filename}\n${signals.title}\n${signals.extractedTextSample}`;
  for (const match of text.matchAll(EURO_AMOUNT_RE)) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    amounts.add(normalizeEuroAmount(raw));
  }
  return [...amounts].sort();
}

export function keyEuroAmountsConflict(amountsA: string[], amountsB: string[]): boolean {
  if (amountsA.length === 0 || amountsB.length === 0) return false;
  const setB = new Set(amountsB);
  for (const amount of amountsA) {
    if (setB.has(amount)) return false;
  }
  return true;
}

export function collectTaxReferenceIds(signals: DuplicateDocumentSignals): string[] {
  const ids = new Set<string>();
  const text = `${signals.filename}\n${signals.title}\n${signals.extractedTextSample}`;
  for (const match of text.matchAll(TAX_ASSESSMENT_ID_RE)) {
    const id = match[1]?.trim().toUpperCase();
    if (id) ids.add(id);
  }
  return [...ids].sort();
}

export function taxReferenceIdsConflict(idsA: string[], idsB: string[]): boolean {
  if (idsA.length === 0 || idsB.length === 0) return false;
  const setB = new Set(idsB);
  for (const id of idsA) {
    if (setB.has(id)) return false;
  }
  return true;
}

function pageCountBlocksEmbedding(
  left: DuplicateDocumentSignals,
  right: DuplicateDocumentSignals,
  similarity: number,
  config: DuplicateDetectionGateConfig
): boolean {
  if (left.pageCount == null || right.pageCount == null) return false;
  if (similarity >= config.pageCountGateMaxSimilarity) return false;
  return Math.abs(left.pageCount - right.pageCount) >= config.pageCountMinDifference;
}

export function evaluateEmbeddingDuplicateCandidate(
  source: DuplicateDocumentSignals,
  candidate: DuplicateDocumentSignals,
  similarity: number,
  config: DuplicateDetectionGateConfig
): EmbeddingDuplicateGateResult {
  const sourceYears = collectReportingYears(source);
  const candidateYears = collectReportingYears(candidate);
  if (reportingYearsConflict(sourceYears, candidateYears)) {
    return { accept: false, reason: 'conflicting_reporting_years' };
  }

  const sourceAmounts = collectKeyEuroAmounts(source);
  const candidateAmounts = collectKeyEuroAmounts(candidate);
  if (keyEuroAmountsConflict(sourceAmounts, candidateAmounts)) {
    return { accept: false, reason: 'conflicting_key_amounts' };
  }

  const sourceTaxIds = collectTaxReferenceIds(source);
  const candidateTaxIds = collectTaxReferenceIds(candidate);
  if (taxReferenceIdsConflict(sourceTaxIds, candidateTaxIds)) {
    return { accept: false, reason: 'conflicting_key_amounts' };
  }

  if (pageCountBlocksEmbedding(source, candidate, similarity, config)) {
    return { accept: false, reason: 'page_count_mismatch' };
  }

  return { accept: true };
}

export function formatReportingYearsForDisplay(years: number[]): string {
  if (years.length === 0) return '—';
  return years.join(', ');
}

export function duplicatePairDifferenceRows(
  primary: DuplicateDocumentSignals,
  other: DuplicateDocumentSignals
): Array<{ label: string; primary: string; other: string; differs: boolean }> {
  const primaryYears = collectReportingYears(primary);
  const otherYears = collectReportingYears(other);
  const primaryAmounts = collectKeyEuroAmounts(primary);
  const otherAmounts = collectKeyEuroAmounts(other);
  const primaryTax = collectTaxReferenceIds(primary);
  const otherTax = collectTaxReferenceIds(other);

  return [
    {
      label: 'period',
      primary: formatReportingYearsForDisplay(primaryYears),
      other: formatReportingYearsForDisplay(otherYears),
      differs: reportingYearsConflict(primaryYears, otherYears),
    },
    {
      label: 'filename',
      primary: primary.filename,
      other: other.filename,
      differs: primary.filename.trim() !== other.filename.trim(),
    },
    {
      label: 'title',
      primary: primary.title,
      other: other.title,
      differs: primary.title.trim() !== other.title.trim(),
    },
    {
      label: 'amounts',
      primary: primaryAmounts.length > 0 ? primaryAmounts.join(', ') : '—',
      other: otherAmounts.length > 0 ? otherAmounts.join(', ') : '—',
      differs: keyEuroAmountsConflict(primaryAmounts, otherAmounts),
    },
    {
      label: 'taxId',
      primary: primaryTax.length > 0 ? primaryTax.join(', ') : '—',
      other: otherTax.length > 0 ? otherTax.join(', ') : '—',
      differs: taxReferenceIdsConflict(primaryTax, otherTax),
    },
  ];
}
