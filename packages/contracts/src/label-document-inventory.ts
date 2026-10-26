// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CursorListQuery, CursorListResponse } from './cursor-list.js';

/** Minimal document shape for label assignment KPIs (library list, one row per document). */
export type LabelInventoryDocument = {
  id: string;
  title?: string;
  filename?: string;
  status?: 'uploaded' | 'queued' | 'extracting' | 'ready' | 'failed';
  tags: { id: string; isInbox?: boolean }[];
};

export type LabelDocumentInventorySummaryResponseDto = {
  inventory: LabelAssignmentInventory;
  documentCountByTagId: Record<string, number>;
};

export type LabelDocumentInventoryResponseDto = LabelDocumentInventorySummaryResponseDto &
  CursorListResponse<LabelInventoryDocument> & {
    /** Same as `items` on the first page for older clients. */
    documents: LabelInventoryDocument[];
  };

export type LabelDocumentInventoryQuery = CursorListQuery;

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
