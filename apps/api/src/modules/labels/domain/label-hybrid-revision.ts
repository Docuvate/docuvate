// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';

import type { LabelHybridDocumentRow } from './label-hybrid-training.js';

function digestText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/** Fingerprint of labeled training rows; unchanged when only unlabeled documents gain embeddings. */
export function computeLabelHybridTrainingRevision(
  rows: readonly LabelHybridDocumentRow[]
): string {
  const parts: string[] = [];
  for (const row of rows) {
    if (row.embedding.length === 0 || row.nonInboxTagIds.length === 0) {
      continue;
    }
    const tags = [...row.nonInboxTagIds].sort((a, b) => a.localeCompare(b)).join(',');
    parts.push(`${row.documentId}\t${tags}\t${digestText(row.text)}`);
  }
  parts.sort((a, b) => a.localeCompare(b));
  return `${String(parts.length)}\n${parts.join('\n')}`;
}
