// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionTableCellDto,
  DocumentRegionTableDto,
  DocumentRegionTableMergeDto,
  DocumentRegionTableRowRoleDto,
  DocumentRegionTableRuleLineDto,
  DocumentRegionTableType,
  TableIndexPosition,
  TableRulingPreset,
} from '@docuvate/contracts';
import {
  inferTableBands,
  tableIndexPosition,
  tableRowBand,
  tableRuling,
  tableRulingLines,
} from '@docuvate/contracts';

/**
 * Composable table layouts. A layout is not one of N fixed presets but a point in three
 * independent dimensions: logical bands (header levels, footer rows, grouped sections), index
 * position (left, right, both) and appearance (lines, zebra). A family only picks sensible
 * defaults; every dimension stays adjustable. The table card edits a draft of this structure in
 * place (row kinds, merges, toolbar), so what the user sees on the table is what gets stored.
 */

export interface GridSize {
  rows: number;
  cols: number;
}

export const TABLE_FAMILIES = [
  'simple',
  'matrix',
  'nested',
  'financial',
  'grouped',
  'key_value',
] as const;
export type TableFamily = (typeof TABLE_FAMILIES)[number];

/** `keep` leaves the recorded line evidence untouched (mixed or unknown rulings). */
export type TableRulingChoice = TableRulingPreset | 'keep';

export interface TableDesign {
  family: TableFamily;
  headerLevels: number;
  index: TableIndexPosition;
  footerRows: number;
  grouped: boolean;
  ruling: TableRulingChoice;
  banded: boolean;
}

export const TABLE_INDEX_POSITIONS: readonly TableIndexPosition[] = [
  'none',
  'left',
  'right',
  'both',
];
export const TABLE_RULING_CHOICES: readonly TableRulingChoice[] = [
  'grid',
  'accounting',
  'horizontal',
  'none',
  'keep',
];
export const MAX_BAND_ROWS = 3;

const FAMILY_TYPE: Record<TableFamily, DocumentRegionTableType> = {
  simple: 'other',
  matrix: 'other',
  nested: 'other',
  financial: 'line_items',
  grouped: 'line_items',
  key_value: 'key_value',
};

/** Defaults per family; the user changes any dimension afterwards. */
export function familyDesign(family: TableFamily): TableDesign {
  const base: TableDesign = {
    family,
    headerLevels: 1,
    index: 'none',
    footerRows: 0,
    grouped: false,
    ruling: 'grid',
    banded: false,
  };
  switch (family) {
    case 'matrix':
      return { ...base, index: 'left' };
    case 'nested':
      return { ...base, headerLevels: 2, index: 'left' };
    case 'financial':
      return { ...base, footerRows: 2, ruling: 'accounting' };
    case 'grouped':
      return { ...base, footerRows: 1, grouped: true, ruling: 'horizontal' };
    case 'key_value':
      return { ...base, headerLevels: 0, index: 'left', ruling: 'none' };
    case 'simple':
      return base;
  }
}

/** One correction carrying every structural dimension (`set_headers`). */
export interface TableStructureChoice {
  tableType: DocumentRegionTableType;
  headerRows: number;
  footerRows: number;
  headerCols: number;
  trailingHeaderCols: number;
  banded: boolean;
  rowRoles: DocumentRegionTableRowRoleDto[];
  merges: DocumentRegionTableMergeDto[];
  /** Absent when the ruling is kept as recorded. */
  ruleLines?: DocumentRegionTableRuleLineDto[];
}

function indexCols(index: TableIndexPosition, cols: number): { lead: number; trail: number } {
  const lead = (index === 'left' || index === 'both') && cols >= 2 ? 1 : 0;
  const trail = (index === 'right' || index === 'both') && cols >= 2 + lead ? 1 : 0;
  return { lead, trail };
}

/** Header and footer always leave at least one body row when the grid allows it. */
function bandRows(design: TableDesign, rows: number): { header: number; footer: number } {
  const room = Math.max(0, rows - 1);
  const header = Math.min(design.headerLevels, room);
  const footer = Math.min(design.footerRows, Math.max(0, room - header));
  return { header, footer };
}

/** Nested header: each upper level groups the data columns below it in pairs (rowspan stubs). */
function headerMerges(
  header: number,
  lead: number,
  trail: number,
  cols: number
): DocumentRegionTableMergeDto[] {
  if (header < 2) return [];
  const merges: DocumentRegionTableMergeDto[] = [];
  for (let col = 0; col < cols; col += 1) {
    if (col < lead || col >= cols - trail) {
      merges.push({ row0: 0, col0: col, rowSpan: header, colSpan: 1 });
    }
  }
  for (let level = 0; level < header - 1; level += 1) {
    const width = 2 ** (header - 1 - level);
    for (let col = lead; col + width <= cols - trail; col += width) {
      merges.push({ row0: level, col0: col, rowSpan: 1, colSpan: width });
    }
  }
  return merges;
}

/** Synthetic sections for previews and grids without text: heading, rows, subtotal, repeat. */
function sketchRowRoles(start: number, end: number): DocumentRegionTableRowRoleDto[] {
  const roles: DocumentRegionTableRowRoleDto[] = [];
  for (let row = start; row + 2 < end; row += 4) {
    roles.push({ row, role: 'section' });
    roles.push({ row: Math.min(row + 3, end - 1), role: 'subtotal' });
  }
  return roles;
}

/** Table structure a design produces for a real grid (and its cell texts, when known). */
export function designTable(
  design: TableDesign,
  grid: GridSize,
  cells: readonly DocumentRegionTableCellDto[] = []
): TableStructureChoice {
  const { header, footer } = bandRows(design, grid.rows);
  const { lead, trail } = indexCols(design.index, grid.cols);
  const bodyEnd = grid.rows - footer;
  let rowRoles: DocumentRegionTableRowRoleDto[] = [];
  if (design.grouped) {
    const fromText = inferTableBands(cells, grid.rows, grid.cols, header).rowRoles.filter(
      (entry) => entry.row < bodyEnd
    );
    rowRoles = fromText.length > 0 ? fromText : sketchRowRoles(header, bodyEnd);
  }
  const merges = headerMerges(header, lead, trail, grid.cols);
  for (const entry of rowRoles) {
    if (entry.role === 'section' && grid.cols >= 2) {
      merges.push({ row0: entry.row, col0: 0, rowSpan: 1, colSpan: grid.cols });
    }
  }
  // Footer labels span the leading columns so the amount stays in its own last column.
  if (trail === 0 && grid.cols >= 3) {
    for (let row = bodyEnd; row < grid.rows; row += 1) {
      merges.push({ row0: row, col0: 0, rowSpan: 1, colSpan: grid.cols - 1 });
    }
  }
  const choice: TableStructureChoice = {
    tableType: FAMILY_TYPE[design.family],
    headerRows: header,
    footerRows: footer,
    headerCols: lead,
    trailingHeaderCols: trail,
    banded: design.banded,
    rowRoles,
    merges,
  };
  if (design.ruling !== 'keep') {
    choice.ruleLines = tableRulingLines(design.ruling, {
      rows: grid.rows,
      cols: grid.cols,
      headerRows: header,
      footerRows: footer,
    });
  }
  return choice;
}

function rulingChoice(table: DocumentRegionTableDto): TableRulingChoice {
  const ruling = tableRuling(table.rules);
  if (ruling === 'grid' || ruling === 'none') return ruling;
  if (ruling === 'horizontal') {
    const accented = table.rules.some((rule) => rule.line === 'thick' || rule.line === 'double');
    return accented ? 'accounting' : 'horizontal';
  }
  return 'keep';
}

/** Reads the design back from a stored table, so the picker opens on what is saved. */
export function tableDesignOf(table: DocumentRegionTableDto): TableDesign {
  const index = tableIndexPosition(table.headerCols, table.trailingHeaderCols);
  const grouped = table.rowRoles.length > 0;
  let family: TableFamily = 'simple';
  if (table.tableType === 'key_value') family = 'key_value';
  else if (grouped) family = 'grouped';
  else if (table.footerRows > 0) family = 'financial';
  else if (table.headerRows >= 2) family = 'nested';
  else if (index !== 'none') family = 'matrix';
  return {
    family,
    headerLevels: Math.min(table.headerRows, MAX_BAND_ROWS),
    index,
    footerRows: Math.min(table.footerRows, MAX_BAND_ROWS),
    grouped,
    ruling: rulingChoice(table),
    banded: table.banded,
  };
}

/** The merge covering a cell, if any (cells inside a span are not drawn on their own). */
export function mergeAt(
  merges: readonly DocumentRegionTableMergeDto[],
  row: number,
  col: number
): DocumentRegionTableMergeDto | null {
  return (
    merges.find(
      (m) => row >= m.row0 && row < m.row0 + m.rowSpan && col >= m.col0 && col < m.col0 + m.colSpan
    ) ?? null
  );
}

/**
 * Toggle a rectangular merge between two cells (click, then Shift+click). Selecting an existing
 * span exactly splits it again; overlapping spans are replaced.
 */
export function toggleTableMerge(
  merges: readonly DocumentRegionTableMergeDto[],
  a: { row: number; col: number },
  b: { row: number; col: number }
): DocumentRegionTableMergeDto[] {
  const next: DocumentRegionTableMergeDto = {
    row0: Math.min(a.row, b.row),
    col0: Math.min(a.col, b.col),
    rowSpan: Math.abs(a.row - b.row) + 1,
    colSpan: Math.abs(a.col - b.col) + 1,
  };
  const same = merges.find(
    (m) =>
      m.row0 === next.row0 &&
      m.col0 === next.col0 &&
      m.rowSpan === next.rowSpan &&
      m.colSpan === next.colSpan
  );
  if (same) return merges.filter((m) => m !== same);
  const overlaps = (m: DocumentRegionTableMergeDto) =>
    m.row0 < next.row0 + next.rowSpan &&
    next.row0 < m.row0 + m.rowSpan &&
    m.col0 < next.col0 + next.colSpan &&
    next.col0 < m.col0 + m.colSpan;
  const kept = merges.filter((m) => !overlaps(m));
  return next.rowSpan === 1 && next.colSpan === 1 ? kept : [...kept, next];
}

/** The structure stored on a table, as an editable draft. */
export function tableStructureOf(table: DocumentRegionTableDto): TableStructureChoice {
  return {
    tableType: table.tableType,
    headerRows: table.headerRows,
    footerRows: table.footerRows,
    headerCols: table.headerCols,
    trailingHeaderCols: table.trailingHeaderCols,
    banded: table.banded,
    rowRoles: table.rowRoles.map((entry) => ({ ...entry })),
    merges: table.merges.map((merge) => ({ ...merge })),
  };
}

/** What a row is, as the user sees it in the row gutter. */
export const TABLE_ROW_KINDS = ['header', 'data', 'section', 'subtotal', 'footer'] as const;
export type TableRowKind = (typeof TABLE_ROW_KINDS)[number];

export function tableRowKind(
  choice: TableStructureChoice,
  grid: GridSize,
  row: number
): TableRowKind {
  const band = tableRowBand({ ...grid, ...choice }, row);
  if (band === 'header') return 'header';
  if (band === 'footer') return 'footer';
  return choice.rowRoles.find((entry) => entry.row === row)?.role ?? 'data';
}

/**
 * Re-label one row directly on the table. Header rows grow from the top and result rows from the
 * bottom (bands stay contiguous); at least one body row always remains. Row roles outside the
 * body and spans that would cross a band edge are dropped, so the draft stays valid.
 */
export function withRowKind(
  choice: TableStructureChoice,
  grid: GridSize,
  row: number,
  kind: TableRowKind
): TableStructureChoice {
  let { headerRows, footerRows } = choice;
  if (kind === 'header') {
    headerRows = Math.min(row + 1, Math.max(0, grid.rows - 1));
    footerRows = Math.min(footerRows, Math.max(0, grid.rows - headerRows - 1));
  } else if (kind === 'footer') {
    footerRows = Math.min(grid.rows - row, Math.max(0, grid.rows - 1));
    headerRows = Math.min(headerRows, Math.max(0, grid.rows - footerRows - 1));
  } else {
    if (row < headerRows) headerRows = row;
    if (row >= grid.rows - footerRows) footerRows = grid.rows - row - 1;
  }
  const bodyEnd = grid.rows - footerRows;
  let rowRoles = choice.rowRoles.filter(
    (entry) => entry.row !== row && entry.row >= headerRows && entry.row < bodyEnd
  );
  if (kind === 'section' || kind === 'subtotal') {
    rowRoles = [...rowRoles, { row, role: kind }].sort((a, b) => a.row - b.row);
  }
  const shape = { ...grid, headerRows, footerRows };
  const merges = choice.merges.filter(
    (merge) =>
      tableRowBand(shape, merge.row0) === tableRowBand(shape, merge.row0 + merge.rowSpan - 1)
  );
  return { ...choice, headerRows, footerRows, rowRoles, merges };
}
