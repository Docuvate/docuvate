// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ApplyTableCorrectionRequest,
  DocumentRegionTableDto,
  DocumentRegionTableMergeDto,
} from '@docuvate/contracts';
import { tableGridSize, validTableMerges, validTableStructure } from '@docuvate/contracts';

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

type StructureInput = Pick<
  ApplyTableCorrectionRequest,
  'footerRows' | 'trailingHeaderCols' | 'banded' | 'rowRoles' | 'ruleLines' | 'merges'
>;

/**
 * Applies the structural part of a `create`/`set_headers` correction (footer, right index, row
 * roles, line evidence, banding, merges) and rejects anything that does not fit the grid.
 */
export function withTableStructure(
  table: DocumentRegionTableDto,
  input: StructureInput
): DocumentRegionTableDto {
  const merged = input.merges !== undefined ? withTableMerges(table, input.merges) : table;
  const next: DocumentRegionTableDto = {
    ...merged,
    footerRows: input.footerRows ?? merged.footerRows,
    trailingHeaderCols: input.trailingHeaderCols ?? merged.trailingHeaderCols,
    banded: input.banded ?? merged.banded,
    rowRoles: [...(input.rowRoles ?? merged.rowRoles)]
      .map((entry) => ({ ...entry }))
      .sort((left, right) => left.row - right.row),
    rules: merged.rules.map((rule) => ({ ...rule })),
  };
  for (const entry of input.ruleLines ?? []) {
    const rule = next.rules.find((item) => item.axis === entry.axis && item.ord === entry.ord);
    if (!rule) {
      throw new ValidationError('documents.tableStructureInvalid');
    }
    rule.line = entry.line;
  }
  const { rows, cols } = tableGridSize(next);
  if (!validTableStructure({ ...next, rows, cols })) {
    throw new ValidationError('documents.tableStructureInvalid');
  }
  return next;
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

/**
 * Stable text form of the structure beyond header rows/cols, for correction payloads. Empty for a
 * table that only uses the original attributes, so their payloads stay byte-identical.
 */
export function serializeTableStructure(
  table: DocumentRegionTableDto
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (table.footerRows > 0) out.footerRows = table.footerRows;
  if (table.trailingHeaderCols > 0) out.trailingHeaderCols = table.trailingHeaderCols;
  if (table.banded) out.banded = true;
  if (table.rowRoles.length > 0) {
    out.rowRoles = table.rowRoles.map((entry) => `${String(entry.row)}:${entry.role}`).join('|');
  }
  const lines = table.rules.filter((rule) => rule.line !== 'unknown');
  if (lines.length > 0) {
    out.ruleLines = lines.map((rule) => `${rule.axis}${String(rule.ord)}:${rule.line}`).join('|');
  }
  return out;
}
