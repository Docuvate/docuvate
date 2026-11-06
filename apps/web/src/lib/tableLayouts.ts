// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableMergeDto, DocumentRegionTableType } from '@docuvate/contracts';

export type TableLayoutId =
  | 'grid'
  | 'header_row'
  | 'header_row_col'
  | 'line_items_totals'
  | 'key_value'
  | 'grouped_rows'
  | 'multi_level_header'
  | 'matrix_stub'
  | 'transposed_key_value'
  | 'form_grid';

interface GridSize {
  rows: number;
  cols: number;
}

export interface TableLayout {
  id: TableLayoutId;
  /** `common` layouts are offered first; the rest sit behind "more layouts". */
  tier: 'common' | 'more';
  tableType: DocumentRegionTableType;
  headerRows: number;
  headerCols: number;
  /** Size of the schematic preview. */
  sketch: GridSize;
  /** Merges for a concrete grid, so a layout adapts to the real table instead of a fixed size. */
  merges: (grid: GridSize) => DocumentRegionTableMergeDto[];
}

const none = (): DocumentRegionTableMergeDto[] => [];

function totalsRow({ rows, cols }: GridSize): DocumentRegionTableMergeDto[] {
  return rows >= 3 && cols >= 3 ? [{ row0: rows - 1, col0: 0, rowSpan: 1, colSpan: cols - 1 }] : [];
}

function groupedFirstColumn({ rows }: GridSize): DocumentRegionTableMergeDto[] {
  const merges: DocumentRegionTableMergeDto[] = [];
  for (let row = 1; row + 1 < rows; row += 2) {
    merges.push({ row0: row, col0: 0, rowSpan: 2, colSpan: 1 });
  }
  return merges;
}

function twoLevelHeader({ rows, cols }: GridSize): DocumentRegionTableMergeDto[] {
  if (rows < 3 || cols < 3) return [];
  const merges: DocumentRegionTableMergeDto[] = [{ row0: 0, col0: 0, rowSpan: 2, colSpan: 1 }];
  for (let col = 1; col + 1 < cols; col += 2) {
    merges.push({ row0: 0, col0: col, rowSpan: 1, colSpan: 2 });
  }
  return merges;
}

function formLines({ rows, cols }: GridSize): DocumentRegionTableMergeDto[] {
  if (cols < 3) return [];
  const merges: DocumentRegionTableMergeDto[] = [
    { row0: 0, col0: 1, rowSpan: 1, colSpan: cols - 1 },
  ];
  if (rows >= 3) merges.push({ row0: rows - 1, col0: 1, rowSpan: 1, colSpan: cols - 1 });
  return merges;
}

/**
 * Named table layouts. The schematic preview and the stored structure come from the same data,
 * so what the picker shows is what gets saved.
 */
export const TABLE_LAYOUTS: readonly TableLayout[] = [
  {
    id: 'header_row',
    tier: 'common',
    tableType: 'other',
    headerRows: 1,
    headerCols: 0,
    sketch: { rows: 4, cols: 4 },
    merges: none,
  },
  {
    id: 'line_items_totals',
    tier: 'common',
    tableType: 'line_items',
    headerRows: 1,
    headerCols: 0,
    sketch: { rows: 5, cols: 4 },
    merges: totalsRow,
  },
  {
    id: 'key_value',
    tier: 'common',
    tableType: 'key_value',
    headerRows: 0,
    headerCols: 1,
    sketch: { rows: 4, cols: 2 },
    merges: none,
  },
  {
    id: 'header_row_col',
    tier: 'common',
    tableType: 'other',
    headerRows: 1,
    headerCols: 1,
    sketch: { rows: 4, cols: 4 },
    merges: none,
  },
  {
    id: 'grouped_rows',
    tier: 'common',
    tableType: 'other',
    headerRows: 1,
    headerCols: 0,
    sketch: { rows: 5, cols: 3 },
    merges: groupedFirstColumn,
  },
  {
    id: 'grid',
    tier: 'common',
    tableType: 'other',
    headerRows: 0,
    headerCols: 0,
    sketch: { rows: 4, cols: 4 },
    merges: none,
  },
  {
    id: 'multi_level_header',
    tier: 'more',
    tableType: 'other',
    headerRows: 2,
    headerCols: 0,
    sketch: { rows: 5, cols: 5 },
    merges: twoLevelHeader,
  },
  {
    id: 'matrix_stub',
    tier: 'more',
    tableType: 'other',
    headerRows: 1,
    headerCols: 1,
    sketch: { rows: 5, cols: 5 },
    merges: none,
  },
  {
    id: 'transposed_key_value',
    tier: 'more',
    tableType: 'key_value',
    headerRows: 1,
    headerCols: 0,
    sketch: { rows: 2, cols: 5 },
    merges: none,
  },
  {
    id: 'form_grid',
    tier: 'more',
    tableType: 'key_value',
    headerRows: 0,
    headerCols: 0,
    sketch: { rows: 4, cols: 4 },
    merges: formLines,
  },
];

/** Table structure a layout produces for a real grid; headers never swallow the whole table. */
export function applyTableLayout(
  layout: TableLayout,
  grid: GridSize
): {
  tableType: DocumentRegionTableType;
  headerRows: number;
  headerCols: number;
  merges: DocumentRegionTableMergeDto[];
} {
  return {
    tableType: layout.tableType,
    headerRows: Math.min(layout.headerRows, Math.max(0, grid.rows - 1)),
    headerCols: Math.min(layout.headerCols, Math.max(0, grid.cols - 1)),
    merges: layout.merges(grid),
  };
}

/** The layout whose structure matches a stored table, if any (pre-selects the picker). */
export function matchingTableLayout(
  table: {
    tableType: DocumentRegionTableType;
    headerRows: number;
    headerCols: number;
    merges: readonly DocumentRegionTableMergeDto[];
  },
  grid: GridSize
): TableLayout | null {
  const key = (merges: readonly DocumentRegionTableMergeDto[]) =>
    merges
      .map((m) => `${String(m.row0)},${String(m.col0)},${String(m.rowSpan)},${String(m.colSpan)}`)
      .sort()
      .join('|');
  return (
    TABLE_LAYOUTS.find((layout) => {
      const applied = applyTableLayout(layout, grid);
      return (
        applied.tableType === table.tableType &&
        applied.headerRows === table.headerRows &&
        applied.headerCols === table.headerCols &&
        key(applied.merges) === key(table.merges)
      );
    }) ?? null
  );
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
