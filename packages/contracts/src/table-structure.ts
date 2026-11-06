// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Table structure model. Three independent dimensions, so layouts compose instead of being a
 * fixed list of presets:
 *
 * - logical bands: header rows (several = nested header, spans via merges), body, footer rows
 *   (results/accounting footer), plus per-row roles inside the body (section headings, subtotals);
 * - index columns: leading and/or trailing header columns (left, right or double index);
 * - appearance: line evidence per grid rule and row banding (zebra). Appearance never decides
 *   semantics; a borderless table can have the same header/footer as a fully ruled one.
 */
import { validTableMerges, type TableGridAxis, type TableGridMerge } from './table-geometry.js';

/** Line drawn on one grid rule. `unknown` means nothing was observed (text-only detection). */
export const TABLE_RULE_LINES = ['unknown', 'none', 'thin', 'thick', 'double'] as const;
export type TableRuleLine = (typeof TABLE_RULE_LINES)[number];

/** Body rows with a structural meaning; every other body row is a data row. */
export const TABLE_ROW_ROLES = ['section', 'subtotal'] as const;
export type TableRowRole = (typeof TABLE_ROW_ROLES)[number];

export type TableBand = 'header' | 'body' | 'footer';
export type TableIndexPosition = 'none' | 'left' | 'right' | 'both';
/** Summary of the line evidence of a table; derived, never stored. */
export type TableRuling = 'unknown' | 'grid' | 'horizontal' | 'none' | 'mixed';
/** Line presets the editor offers; each expands to one line per rule. */
export const TABLE_RULING_PRESETS = ['grid', 'accounting', 'horizontal', 'none'] as const;
export type TableRulingPreset = (typeof TABLE_RULING_PRESETS)[number];

export interface TableRowRoleEntry {
  row: number;
  role: TableRowRole;
}

export interface TableRuleLineEntry {
  axis: TableGridAxis;
  ord: number;
  line: TableRuleLine;
}

export interface TableStructure {
  rows: number;
  cols: number;
  headerRows: number;
  footerRows: number;
  headerCols: number;
  trailingHeaderCols: number;
  rowRoles: readonly TableRowRoleEntry[];
  merges: readonly TableGridMerge[];
}

export function isTableRuleLine(value: unknown): value is TableRuleLine {
  return TABLE_RULE_LINES.some((line) => line === value);
}

export function isTableRowRole(value: unknown): value is TableRowRole {
  return TABLE_ROW_ROLES.some((role) => role === value);
}

export function tableRowBand(
  structure: Pick<TableStructure, 'rows' | 'headerRows' | 'footerRows'>,
  row: number
): TableBand {
  if (row < structure.headerRows) {
    return 'header';
  }
  if (row >= structure.rows - structure.footerRows) {
    return 'footer';
  }
  return 'body';
}

/** True for a leading or trailing index (header) column. */
export function isTableIndexCol(
  structure: Pick<TableStructure, 'cols' | 'headerCols' | 'trailingHeaderCols'>,
  col: number
): boolean {
  return col < structure.headerCols || col >= structure.cols - structure.trailingHeaderCols;
}

export function tableIndexPosition(
  headerCols: number,
  trailingHeaderCols: number
): TableIndexPosition {
  if (headerCols > 0 && trailingHeaderCols > 0) {
    return 'both';
  }
  if (headerCols > 0) {
    return 'left';
  }
  return trailingHeaderCols > 0 ? 'right' : 'none';
}

function nonNegativeInt(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * True when bands, index columns, row roles and merges fit the grid: header and footer never
 * overlap, row roles sit in the body, and no merge crosses a band boundary (a span may not join a
 * header cell with a data cell). Shared by the API and the editor.
 */
export function validTableStructure(structure: TableStructure): boolean {
  const { rows, cols, headerRows, footerRows, headerCols, trailingHeaderCols } = structure;
  const counts = [rows, cols, headerRows, footerRows, headerCols, trailingHeaderCols];
  if (!counts.every(nonNegativeInt)) {
    return false;
  }
  if (headerRows + footerRows > rows || headerCols + trailingHeaderCols > cols) {
    return false;
  }
  const seen = new Set<number>();
  for (const entry of structure.rowRoles) {
    if (!nonNegativeInt(entry.row) || seen.has(entry.row) || !isTableRowRole(entry.role)) {
      return false;
    }
    if (entry.row >= rows || tableRowBand(structure, entry.row) !== 'body') {
      return false;
    }
    seen.add(entry.row);
  }
  if (!validTableMerges(structure.merges, rows, cols)) {
    return false;
  }
  return structure.merges.every(
    (merge) =>
      tableRowBand(structure, merge.row0) ===
      tableRowBand(structure, merge.row0 + merge.rowSpan - 1)
  );
}

/** Derived summary of the line evidence; `mixed` covers partially observed or hand-set rulings. */
export function tableRuling(
  rules: readonly { axis: TableGridAxis; line: TableRuleLine }[]
): TableRuling {
  const known = rules.filter((rule) => rule.line !== 'unknown');
  if (known.length === 0) {
    return 'unknown';
  }
  if (known.length < rules.length) {
    return 'mixed';
  }
  const drawn = (rule: { line: TableRuleLine }) => rule.line !== 'none';
  if (known.every(drawn)) {
    return 'grid';
  }
  if (!known.some(drawn)) {
    return 'none';
  }
  const cols = known.filter((rule) => rule.axis === 'col');
  const rowsDrawn = known.filter((rule) => rule.axis === 'row').some(drawn);
  return rowsDrawn && !cols.some(drawn) ? 'horizontal' : 'mixed';
}

/**
 * One line per rule for a preset. `accounting` follows the financial convention: no vertical
 * lines, a thick rule under the header, thin row rules and a double rule closing the footer.
 */
export function tableRulingLines(
  preset: TableRulingPreset,
  structure: Pick<TableStructure, 'rows' | 'cols' | 'headerRows' | 'footerRows'>
): TableRuleLineEntry[] {
  const lines: TableRuleLineEntry[] = [];
  for (let ord = 0; ord <= structure.rows; ord += 1) {
    lines.push({ axis: 'row', ord, line: rowRuleLine(preset, structure, ord) });
  }
  for (let ord = 0; ord <= structure.cols; ord += 1) {
    lines.push({ axis: 'col', ord, line: preset === 'grid' ? 'thin' : 'none' });
  }
  return lines;
}

function rowRuleLine(
  preset: TableRulingPreset,
  structure: Pick<TableStructure, 'rows' | 'headerRows' | 'footerRows'>,
  ord: number
): TableRuleLine {
  if (preset === 'none') {
    return 'none';
  }
  if (preset !== 'accounting') {
    return 'thin';
  }
  if (structure.headerRows > 0 && ord === structure.headerRows) {
    return 'thick';
  }
  if (structure.footerRows > 0 && ord === structure.rows) {
    return 'double';
  }
  return ord === 0 || ord === structure.rows ? 'none' : 'thin';
}
