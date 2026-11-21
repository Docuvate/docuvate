// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, FieldSuggestionRow } from '@docuvate/contracts';

import {
  openWorkbenchRowCount,
  type SuggestionRejectRef,
  workbenchRows,
} from './reviewWorkbench';

/**
 * Single source of truth for “what is still open” on a document in the viewer.
 * Used by the Strukturieren workbench, aspect strip, and pipeline header so
 * counts stay identical after confirm / reject / Fertig.
 */
export interface DocumentOpenWorkSummary {
  openLabels: number;
  openFields: number;
  openTotal: number;
  /** True when every countable field/label item is settled (confirmed, accepted, or rejected). */
  isDone: boolean;
}

type OpenWorkDocument = Pick<DocumentDto, 'tags' | 'tagSuggestions'>;

export function summarizeDocumentOpenWork(
  doc: OpenWorkDocument,
  fields: readonly ExtractedField[],
  suggestions: readonly FieldSuggestionRow[],
  rejects: readonly SuggestionRejectRef[] = []
): DocumentOpenWorkSummary {
  const assigned = new Set(doc.tags.map((tag) => tag.id));
  const openLabels = (doc.tagSuggestions ?? []).filter((item) => !assigned.has(item.tag.id)).length;
  const openFields = openWorkbenchRowCount(workbenchRows(fields, suggestions, rejects));
  const openTotal = openLabels + openFields;
  return {
    openLabels,
    openFields,
    openTotal,
    isDone: openTotal === 0,
  };
}
