// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelClusterDocumentExclusion } from '../../../shared/domain/ports.js';

export function buildExcludedDocumentsByLabelKey(
  rows: LabelClusterDocumentExclusion[]
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = row.labelKey.trim();
    if (!key) {
      continue;
    }
    const set = out.get(key) ?? new Set<string>();
    set.add(row.documentId);
    out.set(key, set);
  }
  return out;
}

export function filterClusterDocumentIds(
  documentIds: string[],
  labelKey: string,
  excludedByLabelKey: ReadonlyMap<string, ReadonlySet<string>>
): string[] {
  const excluded = excludedByLabelKey.get(labelKey);
  if (!excluded || excluded.size === 0) {
    return documentIds;
  }
  return documentIds.filter((id) => !excluded.has(id));
}
