// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDocumentPreviewDto } from '@docuvate/contracts';

export function stripPdfExtension(name: string): string {
  return name.replace(/\.pdf$/i, '').trim();
}

/** Compare title vs filename ignoring case, underscores, spaces, and .pdf suffix. */
export function docTitleAndFilenameEquivalent(title: string, filename: string): boolean {
  const normalize = (value: string) =>
    stripPdfExtension(value).replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return normalize(title) === normalize(filename);
}

export function recommendationDocumentTitle(doc: LabelRecommendationDocumentPreviewDto): string {
  const rawTitle = doc.title?.trim();
  if (rawTitle) {
    return stripPdfExtension(rawTitle);
  }
  return stripPdfExtension(doc.filename);
}

export function shouldShowRecommendationFilename(
  doc: LabelRecommendationDocumentPreviewDto
): boolean {
  const title = doc.title?.trim();
  if (!title) {
    return false;
  }
  return !docTitleAndFilenameEquivalent(title, doc.filename);
}
