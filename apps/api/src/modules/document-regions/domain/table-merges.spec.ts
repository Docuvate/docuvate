// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  serializeTableMerges,
  serializeTableStructure,
  withTableMerges,
  withTableStructure,
} from './table-merges.js';

function grid(rows: number, cols: number): DocumentRegionTableDto {
  return {
    tableType: 'other',
    headerRows: 1,
    footerRows: 0,
    headerCols: 0,
    trailingHeaderCols: 0,
    banded: false,
    rowRoles: [],
    rules: [
      ...Array.from({ length: rows + 1 }, (_, ord) => ({
        axis: 'row' as const,
        ord,
        pos: ord / rows,
        line: 'unknown' as const,
      })),
      ...Array.from({ length: cols + 1 }, (_, ord) => ({
        axis: 'col' as const,
        ord,
        pos: ord / cols,
        line: 'unknown' as const,
      })),
    ],
    merges: [],
    cells: [],
  };
}

describe('withTableMerges', () => {
  it('stores valid merges in reading order', () => {
    const table = withTableMerges(grid(5, 4), [
      { row0: 4, col0: 0, rowSpan: 1, colSpan: 3 },
      { row0: 1, col0: 0, rowSpan: 2, colSpan: 1 },
    ]);
    expect(table.merges.map((merge) => merge.row0)).toEqual([1, 4]);
    expect(serializeTableMerges(table.merges)).toBe('1,0+2x1|4,0+1x3');
  });

  it('rejects merges outside the grid, overlapping or single-cell', () => {
    const invalid = [
      [{ row0: 4, col0: 0, rowSpan: 2, colSpan: 1 }],
      [
        { row0: 0, col0: 0, rowSpan: 2, colSpan: 2 },
        { row0: 1, col0: 1, rowSpan: 1, colSpan: 2 },
      ],
      [{ row0: 0, col0: 0, rowSpan: 1, colSpan: 1 }],
    ];
    for (const merges of invalid) {
      expect(() => withTableMerges(grid(5, 4), merges)).toThrow(ValidationError);
    }
  });

  it('clearing merges is always allowed', () => {
    expect(withTableMerges(grid(2, 2), []).merges).toEqual([]);
  });
});

describe('withTableStructure', () => {
  it('stores a double index, footer and accounting lines without touching semantics', () => {
    const table = withTableStructure(grid(6, 5), {
      footerRows: 2,
      trailingHeaderCols: 1,
      banded: true,
      ruleLines: [
        { axis: 'row', ord: 1, line: 'thick' },
        { axis: 'row', ord: 6, line: 'double' },
        { axis: 'col', ord: 2, line: 'none' },
      ],
    });
    expect(table).toMatchObject({
      headerRows: 1,
      footerRows: 2,
      trailingHeaderCols: 1,
      banded: true,
    });
    expect(table.rules.find((rule) => rule.axis === 'row' && rule.ord === 6)?.line).toBe('double');
    expect(serializeTableStructure(table)).toEqual({
      footerRows: 2,
      trailingHeaderCols: 1,
      banded: true,
      ruleLines: 'row1:thick|row6:double|col2:none',
    });
  });

  it('keeps payloads of plain tables unchanged', () => {
    expect(serializeTableStructure(grid(3, 3))).toEqual({});
  });

  it('accepts grouped sections with subtotals in the body and spans inside one band', () => {
    const table = withTableStructure(grid(7, 4), {
      footerRows: 1,
      rowRoles: [
        { row: 4, role: 'subtotal' },
        { row: 1, role: 'section' },
      ],
      merges: [
        { row0: 1, col0: 0, rowSpan: 1, colSpan: 4 },
        { row0: 6, col0: 0, rowSpan: 1, colSpan: 3 },
      ],
    });
    expect(table.rowRoles.map((entry) => entry.row)).toEqual([1, 4]);
  });

  it('rejects overlapping bands, roles outside the body, spans across bands and unknown rules', () => {
    const invalid = [
      { footerRows: 5 },
      { trailingHeaderCols: 5 },
      { rowRoles: [{ row: 0, role: 'section' as const }] },
      { footerRows: 1, rowRoles: [{ row: 4, role: 'subtotal' as const }] },
      { merges: [{ row0: 0, col0: 0, rowSpan: 2, colSpan: 1 }] },
      { ruleLines: [{ axis: 'col' as const, ord: 9, line: 'thin' as const }] },
    ];
    for (const input of invalid) {
      expect(() => withTableStructure(grid(5, 4), input)).toThrow(ValidationError);
    }
  });
});
