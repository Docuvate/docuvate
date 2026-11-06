// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto } from '@docuvate/contracts';
import { tableRuling, tableRulingLines, validTableStructure } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  cycleRowRole,
  designTable,
  familyDesign,
  mergeAt,
  TABLE_FAMILIES,
  TABLE_INDEX_POSITIONS,
  TABLE_RULING_CHOICES,
  type TableDesign,
  tableDesignOf,
  toggleTableMerge,
} from './tableLayouts';

function stored(grid: { rows: number; cols: number }, design: TableDesign): DocumentRegionTableDto {
  const choice = designTable(design, grid);
  const rules = (['row', 'col'] as const).flatMap((axis) =>
    Array.from({ length: (axis === 'row' ? grid.rows : grid.cols) + 1 }, (_, ord) => ({
      axis,
      ord,
      pos: ord,
      line: choice.ruleLines?.find((l) => l.axis === axis && l.ord === ord)?.line ?? 'unknown',
    }))
  );
  return { ...choice, rules, cells: [] };
}

describe('composable table layouts', () => {
  it('every combination of dimensions yields a valid structure on odd real grids', () => {
    const grids = [
      { rows: 1, cols: 1 },
      { rows: 2, cols: 2 },
      { rows: 7, cols: 3 },
      { rows: 12, cols: 6 },
    ];
    const designs: TableDesign[] = TABLE_FAMILIES.flatMap((family) =>
      TABLE_INDEX_POSITIONS.flatMap((index) =>
        TABLE_RULING_CHOICES.flatMap((ruling) =>
          [0, 1, 2, 3].flatMap((headerLevels) =>
            [0, 2].flatMap((footerRows) =>
              [false, true].map((grouped) => ({
                ...familyDesign(family),
                index,
                ruling,
                headerLevels,
                footerRows,
                grouped,
              }))
            )
          )
        )
      )
    );
    for (const design of designs) {
      for (const grid of grids) {
        expect(validTableStructure({ ...grid, ...designTable(design, grid) })).toBe(true);
      }
    }
  });

  it('right and double index become trailing (and leading) index columns', () => {
    const grid = { rows: 5, cols: 6 };
    const right = designTable({ ...familyDesign('matrix'), index: 'right' }, grid);
    expect([right.headerCols, right.trailingHeaderCols]).toEqual([0, 1]);
    const both = designTable({ ...familyDesign('matrix'), index: 'both' }, grid);
    expect([both.headerCols, both.trailingHeaderCols]).toEqual([1, 1]);
    // Right index: the footer label cannot span into the index column.
    const financialRight = designTable({ ...familyDesign('financial'), index: 'right' }, grid);
    expect(financialRight.merges).toEqual([]);
    expect(tableDesignOf(stored(grid, { ...familyDesign('matrix'), index: 'both' })).index).toBe(
      'both'
    );
  });

  it('a two-level header over a results footer nests column groups with rowspan stubs', () => {
    const grid = { rows: 6, cols: 5 };
    const choice = designTable({ ...familyDesign('nested'), footerRows: 1 }, grid);
    expect(choice).toMatchObject({ headerRows: 2, footerRows: 1, headerCols: 1 });
    expect(choice.merges).toEqual([
      { row0: 0, col0: 0, rowSpan: 2, colSpan: 1 },
      { row0: 0, col0: 1, rowSpan: 1, colSpan: 2 },
      { row0: 0, col0: 3, rowSpan: 1, colSpan: 2 },
      { row0: 5, col0: 0, rowSpan: 1, colSpan: 4 },
    ]);
  });

  it('grouped sections take headings and subtotals from cell text when present', () => {
    const grid = { rows: 7, cols: 3 };
    const cells = [
      { row: 1, col: 0, text: 'Hardware' },
      { row: 2, col: 0, text: 'Gerät' },
      { row: 2, col: 2, text: '10,00' },
      { row: 3, col: 0, text: 'Zwischensumme' },
      { row: 4, col: 0, text: 'Software' },
      { row: 5, col: 0, text: 'Teilsumme' },
    ];
    const choice = designTable(familyDesign('grouped'), grid, cells);
    expect(choice.rowRoles).toEqual([
      { row: 1, role: 'section' },
      { row: 3, role: 'subtotal' },
      { row: 4, role: 'section' },
      { row: 5, role: 'subtotal' },
    ]);
    expect(mergeAt(choice.merges, 4, 2)).toEqual({ row0: 4, col0: 0, rowSpan: 1, colSpan: 3 });
    expect(tableDesignOf(stored(grid, familyDesign('grouped'))).family).toBe('grouped');
  });

  it('borderless and accounting ruling are appearance only and read back as chosen', () => {
    const grid = { rows: 5, cols: 4 };
    const borderless = designTable(
      { ...familyDesign('simple'), ruling: 'none', banded: true },
      grid
    );
    const plain = designTable(familyDesign('simple'), grid);
    expect({ ...borderless, ruleLines: undefined, banded: false }).toEqual({
      ...plain,
      ruleLines: undefined,
    });
    expect(tableRuling(borderless.ruleLines ?? [])).toBe('none');
    expect(tableDesignOf(stored(grid, familyDesign('financial'))).ruling).toBe('accounting');
    expect(
      tableDesignOf(stored(grid, { ...familyDesign('simple'), ruling: 'horizontal' })).ruling
    ).toBe('horizontal');
    expect(
      designTable({ ...familyDesign('simple'), ruling: 'keep' }, grid).ruleLines
    ).toBeUndefined();
  });

  it('partial, hand-set borders read back as mixed and are kept untouched', () => {
    const grid = { rows: 3, cols: 3 };
    const table = stored(grid, familyDesign('simple'));
    const lines = tableRulingLines('grid', { ...grid, headerRows: 1, footerRows: 0 });
    const partial = lines.map((l) =>
      l.axis === 'col' && l.ord === 1 ? { ...l, line: 'none' as const } : l
    );
    const mixed = {
      ...table,
      rules: table.rules.map((rule, i) => ({ ...rule, line: partial[i]?.line ?? 'unknown' })),
    };
    expect(tableRuling(mixed.rules)).toBe('mixed');
    expect(tableDesignOf(mixed).ruling).toBe('keep');
  });

  it('cycles body row roles data → section → subtotal → data', () => {
    const one = cycleRowRole([], 2);
    expect(one).toEqual([{ row: 2, role: 'section' }]);
    expect(cycleRowRole(one, 2)).toEqual([{ row: 2, role: 'subtotal' }]);
    expect(cycleRowRole(cycleRowRole(one, 2), 2)).toEqual([]);
  });

  it('toggles merges: create, split on reselect, replace overlaps', () => {
    const one = toggleTableMerge([], { row: 0, col: 0 }, { row: 1, col: 1 });
    expect(one).toEqual([{ row0: 0, col0: 0, rowSpan: 2, colSpan: 2 }]);
    expect(mergeAt(one, 1, 1)).toEqual(one[0]);
    expect(toggleTableMerge(one, { row: 1, col: 1 }, { row: 0, col: 0 })).toEqual([]);
    expect(toggleTableMerge(one, { row: 1, col: 0 }, { row: 1, col: 2 })).toEqual([
      { row0: 1, col0: 0, rowSpan: 1, colSpan: 3 },
    ]);
  });
});
