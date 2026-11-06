// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto, DocumentRegionTableMergeDto } from '@docuvate/contracts';
import { tableGridSize, validTableMerges } from '@docuvate/contracts';

import { ValidationError } from '../../../shared/domain/errors.js';

/** Replaces the merged cells of a table after checking them against its real grid. */
export function withTableMerges(
  table: DocumentRegionTableDto,
  merges: readonly DocumentRegionTableMergeDto[]
): DocumentRegionTableDto {
  const { rows, cols } = tableGridSize(table);
  if (!validTableMerges(merges, rows, cols)) {
    throw new ValidationError('documents.tableMergesInvalid');
  }
  const sorted = [...merges]
    .map((merge) => ({ ...merge }))
    .sort((left, right) => left.row0 - right.row0 || left.col0 - right.col0);
  return { ...table, merges: sorted };
}

/** Stable text form for correction payloads; empty when the table has no merges. */
export function serializeTableMerges(merges: readonly DocumentRegionTableMergeDto[]): string {
  return merges
    .map(
      (merge) =>
        `${String(merge.row0)},${String(merge.col0)}+${String(merge.rowSpan)}x${String(merge.colSpan)}`
    )
    .join('|');
}
