// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';

/**
 * Fingerprint of user-confirmed labeled rows (document + tag set).
 * Omits document text so extraction refinements do not invalidate the model.
 */
export function computeLabelHybridTrainingRevision(
  rows: readonly LabelHybridDocumentRow[]
): string {
  const parts: string[] = [];
  for (const row of rows) {
    if (row.embedding.length === 0 || row.nonInboxTagIds.length === 0) {
      continue;
    }
    const tags = [...row.nonInboxTagIds].sort((a, b) => a.localeCompare(b)).join(',');
    parts.push(`${row.documentId}\t${tags}`);
  }
  parts.sort((a, b) => a.localeCompare(b));
  return `${String(parts.length)}\n${parts.join('\n')}`;
}
