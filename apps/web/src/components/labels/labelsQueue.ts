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

function mergeSampleDocumentPreviews(
  items: LabelRecommendationDto[]
): NonNullable<LabelRecommendationDto['sampleDocuments']> {
  const byId = new Map<string, NonNullable<LabelRecommendationDto['sampleDocuments']>[number]>();
  for (const item of items) {
    for (const doc of item.sampleDocuments ?? []) {
      if (!byId.has(doc.id)) {
        byId.set(doc.id, doc);
      }
    }
    for (const id of item.sampleDocumentIds ?? []) {
      if (!byId.has(id)) {
        byId.set(id, { id, title: id, filename: '', status: 'ready' });
      }
    }
  }
  return [...byId.values()];
}

/** Merge assign recommendations that target the same label into one row with a document picker. */
export function enrichAssignRecommendations(
  items: LabelRecommendationDto[]
): LabelRecommendationDto[] {
  const nonAssign: LabelRecommendationDto[] = [];
  const assignByTag = new Map<string, LabelRecommendationDto[]>();

  for (const item of items) {
    if (item.kind !== 'assign') {
      nonAssign.push(item);
      continue;
    }
    const tagId = item.tagId?.trim() ?? '';
    if (!tagId) {
      nonAssign.push(item);
      continue;
    }
    const bucket = assignByTag.get(tagId) ?? [];
    bucket.push(item);
    assignByTag.set(tagId, bucket);
  }

  const groupedAssign: LabelRecommendationDto[] = [];
  for (const group of assignByTag.values()) {
    if (group.length === 1) {
      groupedAssign.push(group[0]);
      continue;
    }
    const sorted = [...group].sort((a, b) => b.score - a.score);
    const primary = sorted[0];
    const sampleDocuments = mergeSampleDocumentPreviews(sorted);
    groupedAssign.push({
      ...primary,
      sampleDocumentIds: sampleDocuments.map((doc) => doc.id),
      sampleDocuments,
    });
  }

  return [...nonAssign, ...groupedAssign];
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
  const withAssign = enrichAssignRecommendations(items);
  return sortLabelQueue(enrichMergeRecommendations(withAssign, documents));
}
