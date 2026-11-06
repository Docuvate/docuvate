// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentRegionDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { CorrectedTableCard } from './CorrectedTableCard';

const rows = 4;
const cols = 3;
const region: DocumentRegionDto = {
  id: 'table-1',
  documentId: 'doc-1',
  page: 1,
  shape: 'rect',
  role: 'table',
  x0: 0.1,
  y0: 0.1,
  x1: 0.9,
  y1: 0.5,
  irSha256: 'sha',
  needsReview: false,
  blockIndexes: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  table: {
    tableType: 'other',
    headerRows: 0,
    headerCols: 0,
    rules: [
      ...Array.from({ length: rows + 1 }, (_, ord) => ({ axis: 'row' as const, ord, pos: ord })),
      ...Array.from({ length: cols + 1 }, (_, ord) => ({ axis: 'col' as const, ord, pos: ord })),
    ],
    merges: [{ row0: 3, col0: 0, rowSpan: 1, colSpan: 2 }],
    cells: [{ row: 3, col: 0, text: 'Summe' }],
  },
};

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

afterEach(cleanup);

describe('CorrectedTableCard', () => {
  it('renders stored merged cells as real spans', () => {
    render(<CorrectedTableCard region={region} index={0} active onSelect={vi.fn()} />);
    const sum = screen.getByDisplayValue('Summe').closest('td');
    expect(sum?.getAttribute('colspan')).toBe('2');
  });

  it('applies a named layout with header band and merges in one step', () => {
    const onLayoutApply = vi.fn();
    render(
      <CorrectedTableCard
        region={region}
        index={0}
        active
        onSelect={vi.fn()}
        onLayoutApply={onLayoutApply}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Layout für Tabelle 1 wählen' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Positionen mit Summe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Layout übernehmen' }));
    expect(onLayoutApply).toHaveBeenCalledWith({
      tableType: 'line_items',
      headerRows: 1,
      headerCols: 0,
      merges: [{ row0: 3, col0: 0, rowSpan: 1, colSpan: 2 }],
    });
  });

  it('merges a custom area with select + M and splits it again', () => {
    const onLayoutApply = vi.fn();
    render(
      <CorrectedTableCard
        region={{ ...region, table: region.table ? { ...region.table, merges: [] } : undefined }}
        index={0}
        active
        onSelect={vi.fn()}
        onLayoutApply={onLayoutApply}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Layout für Tabelle 1 wählen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zeile 1, Spalte 1, 1 × 1' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Zeile 1, Spalte 3, 1 × 1' }), {
      key: 'm',
    });
    expect(screen.getByRole('button', { name: 'Zeile 1, Spalte 1, 1 × 3' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Layout übernehmen' }));
    expect(onLayoutApply).toHaveBeenLastCalledWith(
      expect.objectContaining({ merges: [{ row0: 0, col0: 0, rowSpan: 1, colSpan: 3 }] })
    );
  });
});
