// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, LabelRecommendationDocumentPreviewDto, TagDto } from '@docuvate/contracts';

export interface GroupedLibraryLabelSuggestion {
  tag: TagDto;
  reason: string;
  confidence?: number;
  documents: LabelRecommendationDocumentPreviewDto[];
}

function docToPreview(doc: DocumentDto): LabelRecommendationDocumentPreviewDto {
  return {
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    documentDate: doc.documentDate,
    status: doc.status,
  };
}

function topSuggestionForDocument(doc: DocumentDto): { tag: TagDto; reason: string; confidence?: number } | null {
  const suggestions = doc.tagSuggestions ?? [];
  if (suggestions.length === 0) {
    return null;
  }
  const assigned = new Set(doc.tags.map((tag) => tag.id));
  const eligible = suggestions.filter((row) => !assigned.has(row.tag.id));
  if (eligible.length === 0) {
    return null;
  }
  const sorted = [...eligible].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
  );
  const best = sorted[0];
  return { tag: best.tag, reason: best.reason, confidence: best.confidence };
}

/** Groups shared tag suggestions across library documents (subset accept in UI). */
export function computeGroupedLibraryLabelSuggestions(
  documents: DocumentDto[],
  options?: { minDocuments?: number }
): GroupedLibraryLabelSuggestion[] {
  const minDocuments = options?.minDocuments ?? 2;
  const byTag = new Map<
    string,
    { tag: TagDto; reason: string; confidence?: number; docs: DocumentDto[] }
  >();

  for (const doc of documents) {
    const suggestion = topSuggestionForDocument(doc);
    if (!suggestion) {
      continue;
    }
    const existing = byTag.get(suggestion.tag.id);
    if (existing) {
      existing.docs.push(doc);
      if ((suggestion.confidence ?? 0) > (existing.confidence ?? 0)) {
        existing.confidence = suggestion.confidence;
        existing.reason = suggestion.reason;
      }
    } else {
      byTag.set(suggestion.tag.id, {
        tag: suggestion.tag,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        docs: [doc],
      });
    }
  }

  return [...byTag.values()]
    .filter((group) => group.docs.length >= minDocuments)
    .sort((a, b) => b.docs.length - a.docs.length)
    .map((group) => ({
      tag: group.tag,
      reason: group.reason,
      confidence: group.confidence,
      documents: group.docs.map(docToPreview),
    }));
}

export function filterGroupedSuggestionsToSelection(
  groups: GroupedLibraryLabelSuggestion[],
  selectedIds: ReadonlySet<string>
): GroupedLibraryLabelSuggestion[] {
  if (selectedIds.size === 0) {
    return groups;
  }
  return groups
    .map((group) => ({
      ...group,
      documents: group.documents.filter((doc) => selectedIds.has(doc.id)),
    }))
    .filter((group) => group.documents.length >= 2);
}
