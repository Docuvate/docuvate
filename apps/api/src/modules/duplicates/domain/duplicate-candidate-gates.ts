// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateDetectionConfig } from './duplicate-detection.config.js';
import type { DuplicateDocumentSignals } from './duplicate-document-signals.js';

export type DuplicateGateRejectionReason = 'conflicting_reporting_years' | 'page_count_mismatch';

export interface EmbeddingDuplicateGateResult {
  accept: boolean;
  reason?: DuplicateGateRejectionReason;
}

const CALENDAR_YEAR_RE = /\b(19|20)\d{2}\b/g;
const DECEMBER_CLOSING_DATE_RE =
  /(?:31\s*\.\s*12\s*\.?|31\s*\.\s*Dez(?:ember)?)\s*\.?\s*((?:19|20)\d{2})/gi;

/** Collect likely fiscal/reporting years from filename, title, OCR sample, and document date. */
export function collectReportingYears(signals: DuplicateDocumentSignals): number[] {
  const years = new Set<number>();
  const textParts = [signals.filename, signals.title, signals.extractedTextSample];

  for (const part of textParts) {
    for (const match of part.matchAll(CALENDAR_YEAR_RE)) {
      const year = Number(match[0]);
      if (year >= 1990 && year <= 2099) years.add(year);
    }
    for (const match of part.matchAll(DECEMBER_CLOSING_DATE_RE)) {
      const year = Number(match[1]);
      if (year >= 1990 && year <= 2099) years.add(year);
    }
  }

  if (signals.documentDateYear != null && signals.documentDateYear >= 1990) {
    years.add(signals.documentDateYear);
  }

  return [...years].sort((a, b) => a - b);
}

export function reportingYearsConflict(yearsA: number[], yearsB: number[]): boolean {
  if (yearsA.length === 0 || yearsB.length === 0) return false;
  const setB = new Set(yearsB);
  for (const year of yearsA) {
    if (setB.has(year)) return false;
  }
  return true;
}

function pageCountBlocksEmbedding(
  left: DuplicateDocumentSignals,
  right: DuplicateDocumentSignals,
  similarity: number,
  config: DuplicateDetectionConfig
): boolean {
  if (left.pageCount == null || right.pageCount == null) return false;
  if (similarity >= config.pageCountGateMaxSimilarity) return false;
  return Math.abs(left.pageCount - right.pageCount) >= config.pageCountMinDifference;
}

/**
 * Hybrid gates for embedding-based duplicate candidates. Hash matches bypass this entirely.
 */
export function evaluateEmbeddingDuplicateCandidate(
  source: DuplicateDocumentSignals,
  candidate: DuplicateDocumentSignals,
  similarity: number,
  config: DuplicateDetectionConfig
): EmbeddingDuplicateGateResult {
  const sourceYears = collectReportingYears(source);
  const candidateYears = collectReportingYears(candidate);
  if (reportingYearsConflict(sourceYears, candidateYears)) {
    return { accept: false, reason: 'conflicting_reporting_years' };
  }

  if (pageCountBlocksEmbedding(source, candidate, similarity, config)) {
    return { accept: false, reason: 'page_count_mismatch' };
  }

  return { accept: true };
}
