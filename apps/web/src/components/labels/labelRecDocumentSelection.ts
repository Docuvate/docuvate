// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDocumentPreviewDto } from '@docuvate/contracts';

export function initialSelectedDocumentIds(
  documents: Pick<LabelRecommendationDocumentPreviewDto, 'id'>[]
): Set<string> {
  return new Set(documents.map((doc) => doc.id));
}

export function syncSelectedDocumentIds(
  prev: Set<string>,
  documents: Pick<LabelRecommendationDocumentPreviewDto, 'id'>[]
): Set<string> {
  const validIds = new Set(documents.map((doc) => doc.id));
  const next = new Set<string>();
  for (const id of prev) {
    if (validIds.has(id)) {
      next.add(id);
    }
  }
  for (const doc of documents) {
    if (!next.has(doc.id)) {
      next.add(doc.id);
    }
  }
  return next;
}

export function allDocumentsSelected(
  selected: ReadonlySet<string>,
  documents: Pick<LabelRecommendationDocumentPreviewDto, 'id'>[]
): boolean {
  return documents.length > 0 && documents.every((doc) => selected.has(doc.id));
}

export function excludedDocumentIds(
  documents: Pick<LabelRecommendationDocumentPreviewDto, 'id'>[],
  selected: ReadonlySet<string>
): string[] {
  return documents.filter((doc) => !selected.has(doc.id)).map((doc) => doc.id);
}

export function selectedDocumentIds(
  documents: Pick<LabelRecommendationDocumentPreviewDto, 'id'>[],
  selected: ReadonlySet<string>
): string[] {
  return documents.filter((doc) => selected.has(doc.id)).map((doc) => doc.id);
}
