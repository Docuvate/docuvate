// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Minimal document shape for label assignment KPIs (library list, one row per document). */
export type LabelInventoryDocument = {
  id: string;
  tags: { id: string; isInbox?: boolean }[];
};

export type LabelAssignmentInventory = {
  total: number;
  labeled: number;
  unlabeled: number;
};

/** Counts documents with at least one non-inbox tag; inbox-only counts as unlabeled. */
export function summarizeLabelAssignmentInventory(
  documents: LabelInventoryDocument[]
): LabelAssignmentInventory {
  const total = documents.length;
  let labeled = 0;
  for (const doc of documents) {
    if (doc.tags.some((tag) => !tag.isInbox)) {
      labeled += 1;
    }
  }
  return { total, labeled, unlabeled: total - labeled };
}
