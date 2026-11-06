// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { validTableMerges } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  applyTableLayout,
  matchingTableLayout,
  mergeAt,
  TABLE_LAYOUTS,
  toggleTableMerge,
} from './tableLayouts';

const byId = (id: string) => {
  const layout = TABLE_LAYOUTS.find((entry) => entry.id === id);
  if (!layout) throw new Error(id);
  return layout;
};

describe('table layouts', () => {
  it('every layout yields valid merges for its sketch and for odd real grids', () => {
    const grids = [
      { rows: 1, cols: 1 },
      { rows: 2, cols: 2 },
      { rows: 7, cols: 3 },
      { rows: 12, cols: 6 },
    ];
    for (const layout of TABLE_LAYOUTS) {
      for (const grid of [layout.sketch, ...grids]) {
        const applied = applyTableLayout(layout, grid);
        expect(validTableMerges(applied.merges, grid.rows, grid.cols)).toBe(true);
        expect(applied.headerRows).toBeLessThan(Math.max(1, grid.rows));
      }
    }
  });

  it('offers six common layouts first', () => {
    expect(TABLE_LAYOUTS.filter((layout) => layout.tier === 'common')).toHaveLength(6);
    expect(TABLE_LAYOUTS.findIndex((layout) => layout.tier === 'more')).toBe(6);
  });

  it('line items with totals spans the label across all but the amount column', () => {
    expect(applyTableLayout(byId('line_items_totals'), { rows: 6, cols: 5 })).toEqual({
      tableType: 'line_items',
      headerRows: 1,
      headerCols: 0,
      merges: [{ row0: 5, col0: 0, rowSpan: 1, colSpan: 4 }],
    });
  });

  it('recognises the layout a stored table already has', () => {
    const grid = { rows: 6, cols: 5 };
    const stored = applyTableLayout(byId('grouped_rows'), grid);
    expect(matchingTableLayout(stored, grid)?.id).toBe('grouped_rows');
    expect(matchingTableLayout({ ...stored, headerCols: 2 }, grid)).toBeNull();
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
