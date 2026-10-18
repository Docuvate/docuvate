// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentDto,
  LabelRecommendationDto,
  LabelRecommendationKind,
} from '@docuvate/contracts';

const KIND_ORDER: Record<LabelRecommendationKind, number> = {
  assign: 0,
  new: 1,
  merge: 2,
  rename: 3,
};

function docHasNonInboxTag(doc: DocumentDto, tagId: string): boolean {
  return doc.tags.some((tag) => tag.id === tagId && !tag.isInbox);
}

export function enrichMergeRecommendations(
  items: LabelRecommendationDto[],
  documents: DocumentDto[],
  maxPerTag = 2
): LabelRecommendationDto[] {
  return items.map((item) => {
    if (item.kind !== 'merge' || item.sampleDocuments?.length) {
      return item;
    }
    const tagIds = item.tagIds ?? [];
    if (tagIds.length < 2) {
      return item;
    }
    const [tagA, tagB] = tagIds;
    const fromA: LabelRecommendationDto['sampleDocuments'] = [];
    const fromB: LabelRecommendationDto['sampleDocuments'] = [];
    for (const doc of documents) {
      if (fromA.length < maxPerTag && docHasNonInboxTag(doc, tagA)) {
        fromA.push({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          status: doc.status,
        });
      }
      if (fromB.length < maxPerTag && docHasNonInboxTag(doc, tagB)) {
        fromB.push({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          status: doc.status,
        });
      }
      if (fromA.length >= maxPerTag && fromB.length >= maxPerTag) {
        break;
      }
    }
    const sampleDocuments = [...fromA, ...fromB];
    return sampleDocuments.length > 0 ? { ...item, sampleDocuments } : item;
  });
}

/** Client-side ordering: unlabeled work (assign/new) before merge/rename, then by score. */
export function sortLabelQueue(items: LabelRecommendationDto[]): LabelRecommendationDto[] {
  return [...items].sort((a, b) => {
    const kindDelta = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kindDelta !== 0) {
      return kindDelta;
    }
    return b.score - a.score;
  });
}

export function prepareLabelQueue(
  items: LabelRecommendationDto[],
  documents: DocumentDto[]
): LabelRecommendationDto[] {
  return sortLabelQueue(enrichMergeRecommendations(items, documents));
}
