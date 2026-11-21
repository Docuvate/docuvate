// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment node */
import type { DocumentRegionTableDto } from '@docuvate/contracts';
import { tableGridSize } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  distributeTableAxis,
  insertTableCol,
  insertTableRow,
  splitTableBandAtPos,
  tableDraftToCsv,
} from './tableGridOps';
import { tableStructureOf } from './tableLayouts';

const table: DocumentRegionTableDto = {
  tableType: 'other',
  headerRows: 1,
  footerRows: 0,
  headerCols: 0,
  trailingHeaderCols: 0,
  banded: false,
  rowRoles: [],
  rules: [
    { axis: 'row', ord: 0, pos: 0.1, line: 'thin' },
    { axis: 'row', ord: 1, pos: 0.3, line: 'thin' },
    { axis: 'row', ord: 2, pos: 0.5, line: 'thin' },
    { axis: 'col', ord: 0, pos: 0.1, line: 'thin' },
    { axis: 'col', ord: 1, pos: 0.4, line: 'thin' },
    { axis: 'col', ord: 2, pos: 0.7, line: 'thin' },
  ],
  merges: [],
  cells: [
    { row: 0, col: 0, text: 'A' },
    { row: 0, col: 1, text: 'B' },
    { row: 1, col: 0, text: 'C' },
    { row: 1, col: 1, text: 'D' },
  ],
};

describe('tableGridOps', () => {
  it('inserts a row and grows the grid', () => {
    const choice = tableStructureOf(table);
    const next = insertTableRow(table, choice, 1);
    expect(tableGridSize({ rules: next.rules, cells: next.cells }).rows).toBe(3);
    expect(next.cells.find((cell) => cell.row === 2 && cell.col === 0)?.text).toBe('C');
  });

  it('inserts a column and grows the grid', () => {
    const choice = tableStructureOf(table);
    const next = insertTableCol(table, choice, 1);
    expect(tableGridSize({ rules: next.rules, cells: next.cells }).cols).toBe(3);
  });

  it('distributes row dividers evenly', () => {
    const choice = tableStructureOf(table);
    const next = distributeTableAxis(table, choice, 'row');
    const rows = next.rules.filter((rule) => rule.axis === 'row').sort((a, b) => a.ord - b.ord);
    expect(rows[1]?.pos).toBeCloseTo(0.3, 5);
  });

  it('exports csv with quotes', () => {
    const csv = tableDraftToCsv(table, tableStructureOf(table), ';');
    expect(csv).toContain('"A";"B"');
    expect(csv).toContain('"C";"D"');
  });

  it('splits a band at a click position and keeps text in the top/left half', () => {
    const choice = tableStructureOf(table);
    const next = splitTableBandAtPos(table, choice, 'col', 0.25);
    expect(next).not.toBeNull();
    expect(tableGridSize({ rules: next!.rules, cells: next!.cells }).cols).toBe(3);
    expect(next!.cells.find((cell) => cell.row === 0 && cell.col === 0)?.text).toBe('A');
    expect(next!.cells.find((cell) => cell.row === 0 && cell.col === 2)?.text).toBe('B');
  });
});
