// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { LayoutToken, NormalizedRect } from './region-geometry.js';
import { normalizeRect } from './region-geometry.js';
import type { TableRowRoleEntry } from './table-structure.js';

export type TableGridAxis = 'row' | 'col';

export interface TableGridRule {
  axis: TableGridAxis;
  ord: number;
  pos: number;
}

export interface TableGridCell {
  row: number;
  col: number;
  text: string;
}

export interface InferredTableGrid {
  headerRows: number;
  footerRows: number;
  headerCols: number;
  rowRoles: TableRowRoleEntry[];
  rules: TableGridRule[];
  cells: TableGridCell[];
}

const TOTAL_LABEL =
  /^(gesamt|gesamtbetrag|summe|endsumme|netto|brutto|mwst|ust|umsatzsteuer|total|grand total|net|tax|vat|amount due)\b/i;
const SUBTOTAL_LABEL = /^(zwischensumme|teilsumme|subtotal|sub-total)/i;

/**
 * Semantic bands from cell text alone (no line evidence): trailing total/tax rows become the
 * footer, a body row with a subtotal label is a subtotal, and a body row whose only text sits in
 * its first cell is a section heading.
 */
export function inferTableBands(
  cells: readonly TableGridCell[],
  rows: number,
  cols: number,
  headerRows: number
): { footerRows: number; rowRoles: TableRowRoleEntry[] } {
  const rowTexts = (row: number) =>
    Array.from(
      { length: cols },
      (_, col) => cells.find((cell) => cell.row === row && cell.col === col)?.text.trim() ?? ''
    );
  const label = (texts: string[]) => texts.find((text) => text.length > 0) ?? '';
  let footerRows = 0;
  for (let row = rows - 1; row > headerRows; row -= 1) {
    const text = label(rowTexts(row));
    if (!TOTAL_LABEL.test(text) || SUBTOTAL_LABEL.test(text)) {
      break;
    }
    footerRows += 1;
  }
  const rowRoles: TableRowRoleEntry[] = [];
  if (cols < 2) {
    return { footerRows, rowRoles };
  }
  for (let row = headerRows; row < rows - footerRows; row += 1) {
    const texts = rowTexts(row);
    if (SUBTOTAL_LABEL.test(label(texts))) {
      rowRoles.push({ row, role: 'subtotal' });
    } else if (texts[0] !== '' && texts.slice(1).every((text) => text === '') && cols >= 3) {
      rowRoles.push({ row, role: 'section' });
    }
  }
  return { footerRows, rowRoles };
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const atMid = sorted[mid];
  return atMid ?? 0;
}

function clusterTokens(
  tokens: readonly LayoutToken[],
  axis: TableGridAxis,
  minGap: number
): LayoutToken[][] {
  if (tokens.length === 0) {
    return [];
  }
  const sorted = [...tokens].sort((left, right) => {
    const leftCenter = axis === 'row' ? (left.y0 + left.y1) / 2 : (left.x0 + left.x1) / 2;
    const rightCenter = axis === 'row' ? (right.y0 + right.y1) / 2 : (right.x0 + right.x1) / 2;
    return leftCenter - rightCenter;
  });
  const first = sorted[0];
  if (!first) {
    return [];
  }
  const groups: LayoutToken[][] = [[first]];
  for (let index = 1; index < sorted.length; index += 1) {
    const token = sorted[index];
    const current = groups[groups.length - 1];
    const prev = current?.[current.length - 1];
    if (!token || !current || !prev) {
      continue;
    }
    const prevCenter = axis === 'row' ? (prev.y0 + prev.y1) / 2 : (prev.x0 + prev.x1) / 2;
    const nextCenter = axis === 'row' ? (token.y0 + token.y1) / 2 : (token.x0 + token.x1) / 2;
    if (nextCenter - prevCenter >= minGap) {
      groups.push([token]);
    } else {
      current.push(token);
    }
  }
  return groups;
}

function extent(tokens: readonly LayoutToken[], axis: TableGridAxis): { min: number; max: number } {
  let min = 1;
  let max = 0;
  for (const token of tokens) {
    const low = axis === 'row' ? token.y0 : token.x0;
    const high = axis === 'row' ? token.y1 : token.x1;
    if (low < min) {
      min = low;
    }
    if (high > max) {
      max = high;
    }
  }
  return { min, max };
}

function rulePositions(
  extents: { min: number; max: number }[],
  start: number,
  end: number
): number[] {
  const positions = [start];
  for (let index = 0; index < extents.length - 1; index += 1) {
    const current = extents[index];
    const next = extents[index + 1];
    if (!current || !next) {
      continue;
    }
    positions.push((current.max + next.min) / 2);
  }
  positions.push(end);
  return positions;
}

function joinCellText(tokens: readonly LayoutToken[]): string {
  return [...tokens]
    .sort((left, right) => (left.y0 === right.y0 ? left.x0 - right.x0 : left.y0 - right.y0))
    .map((token) => token.text.trim())
    .filter((text) => text.length > 0)
    .join(' ');
}

export function inferTableGrid(
  tokens: readonly LayoutToken[],
  rect: NormalizedRect
): InferredTableGrid {
  const box = normalizeRect(rect) ?? { x0: 0, y0: 0, x1: 1, y1: 1 };
  if (tokens.length === 0) {
    return {
      headerRows: 0,
      footerRows: 0,
      headerCols: 0,
      rowRoles: [],
      rules: [
        { axis: 'row', ord: 0, pos: box.y0 },
        { axis: 'row', ord: 1, pos: box.y1 },
        { axis: 'col', ord: 0, pos: box.x0 },
        { axis: 'col', ord: 1, pos: box.x1 },
      ],
      cells: [{ row: 0, col: 0, text: '' }],
    };
  }
  const rowGap = Math.max(0.008, median(tokens.map((token) => token.y1 - token.y0)) * 0.7);
  const colGap = Math.max(0.008, median(tokens.map((token) => token.x1 - token.x0)) * 0.7);
  const rowGroups = clusterTokens(tokens, 'row', rowGap);
  const colGroups = clusterTokens(tokens, 'col', colGap);
  const rowCount = Math.max(1, rowGroups.length);
  const colCount = Math.max(1, colGroups.length);
  const rowOf = new Map<number, number>();
  rowGroups.forEach((group, row) => {
    for (const token of group) {
      rowOf.set(token.blockIndex, row);
    }
  });
  const colOf = new Map<number, number>();
  colGroups.forEach((group, col) => {
    for (const token of group) {
      colOf.set(token.blockIndex, col);
    }
  });
  const buckets = new Map<string, LayoutToken[]>();
  for (const token of tokens) {
    const row = rowOf.get(token.blockIndex) ?? 0;
    const col = colOf.get(token.blockIndex) ?? 0;
    const key = `${row}:${col}`;
    const list = buckets.get(key) ?? [];
    list.push(token);
    buckets.set(key, list);
  }
  const cells: TableGridCell[] = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      cells.push({
        row,
        col,
        text: joinCellText(buckets.get(`${row}:${col}`) ?? []),
      });
    }
  }
  const rowExtents = rowGroups.map((group) => extent(group, 'row'));
  const colExtents = colGroups.map((group) => extent(group, 'col'));
  const rowPos = rulePositions(rowExtents, box.y0, box.y1);
  const colPos = rulePositions(colExtents, box.x0, box.x1);
  const rules: TableGridRule[] = [
    ...rowPos.map((pos, ord) => ({ axis: 'row' as const, ord, pos })),
    ...colPos.map((pos, ord) => ({ axis: 'col' as const, ord, pos })),
  ];
  const headerRows = rowCount >= 2 ? 1 : 0;
  const bands = inferTableBands(cells, rowCount, colCount, headerRows);
  return {
    headerRows,
    footerRows: bands.footerRows,
    headerCols: 0,
    rowRoles: bands.rowRoles,
    rules,
    cells,
  };
}

export interface TableGridMerge {
  row0: number;
  col0: number;
  rowSpan: number;
  colSpan: number;
}

/**
 * True when every merge covers at least two cells, stays inside a `rows` x `cols` grid and no
 * two merges overlap. Shared by the API (rejects bad input) and the editor (disables apply).
 */
export function validTableMerges(
  merges: readonly TableGridMerge[],
  rows: number,
  cols: number
): boolean {
  const covered = new Set<number>();
  for (const merge of merges) {
    const ints = [merge.row0, merge.col0, merge.rowSpan, merge.colSpan].every(Number.isInteger);
    if (!ints || merge.row0 < 0 || merge.col0 < 0 || merge.rowSpan < 1 || merge.colSpan < 1) {
      return false;
    }
    if (merge.rowSpan * merge.colSpan < 2) {
      return false;
    }
    if (merge.row0 + merge.rowSpan > rows || merge.col0 + merge.colSpan > cols) {
      return false;
    }
    for (let row = merge.row0; row < merge.row0 + merge.rowSpan; row += 1) {
      for (let col = merge.col0; col < merge.col0 + merge.colSpan; col += 1) {
        const key = row * cols + col;
        if (covered.has(key)) {
          return false;
        }
        covered.add(key);
      }
    }
  }
  return true;
}

/** Grid size of a stored table: rules are frame edges plus dividers, so n rules bound n-1 bands. */
export function tableGridSize(table: {
  rules: readonly TableGridRule[];
  cells: readonly TableGridCell[];
}): { rows: number; cols: number } {
  const fromRules = (axis: TableGridAxis) =>
    Math.max(0, table.rules.filter((rule) => rule.axis === axis).length - 1);
  const fromCells = (pick: (cell: TableGridCell) => number) =>
    table.cells.reduce((max, cell) => Math.max(max, pick(cell) + 1), 0);
  return {
    rows: Math.max(
      fromRules('row'),
      fromCells((cell) => cell.row)
    ),
    cols: Math.max(
      fromRules('col'),
      fromCells((cell) => cell.col)
    ),
  };
}
