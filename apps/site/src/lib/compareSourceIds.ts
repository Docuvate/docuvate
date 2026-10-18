// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CompareRow } from './compareData';

export function sourceIdsFromRows(rows: CompareRow[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    for (const cell of [row.docuvate, row.other]) {
      for (const part of cell.sources.split(',')) {
        const code = part.trim();
        if (code) ids.add(code);
      }
    }
  }
  return [...ids];
}
