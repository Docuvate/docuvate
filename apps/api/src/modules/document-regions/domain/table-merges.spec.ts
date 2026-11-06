// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../../shared/domain/errors.js';
import { serializeTableMerges, withTableMerges } from './table-merges.js';

function grid(rows: number, cols: number): DocumentRegionTableDto {
  return {
    tableType: 'other',
    headerRows: 1,
    headerCols: 0,
    rules: [
      ...Array.from({ length: rows + 1 }, (_, ord) => ({
        axis: 'row' as const,
        ord,
        pos: ord / rows,
      })),
      ...Array.from({ length: cols + 1 }, (_, ord) => ({
        axis: 'col' as const,
        ord,
        pos: ord / cols,
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
