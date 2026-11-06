// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentRegionDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { CorrectedTableCard } from './CorrectedTableCard';
import type { TableStructureChoice } from './TableLayoutPicker';

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
    footerRows: 0,
    headerCols: 0,
    trailingHeaderCols: 0,
    banded: false,
    rowRoles: [],
    rules: [
      ...Array.from({ length: rows + 1 }, (_, ord) => ({
        axis: 'row' as const,
        ord,
        pos: ord,
        line: 'unknown' as const,
      })),
      ...Array.from({ length: cols + 1 }, (_, ord) => ({
        axis: 'col' as const,
        ord,
        pos: ord,
        line: 'unknown' as const,
      })),
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

  it('applies a table family with header, footer, merges and accounting lines in one step', () => {
    const onLayoutApply = vi.fn<(choice: TableStructureChoice) => void>();
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
    fireEvent.click(screen.getByRole('radio', { name: 'Finanzlayout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Layout übernehmen' }));
    const choice = onLayoutApply.mock.calls[0]?.[0];
    expect(choice).toMatchObject({
      tableType: 'line_items',
      headerRows: 1,
      footerRows: 2,
      headerCols: 0,
      trailingHeaderCols: 0,
      merges: [
        { row0: 2, col0: 0, rowSpan: 1, colSpan: 2 },
        { row0: 3, col0: 0, rowSpan: 1, colSpan: 2 },
      ],
    });
    expect(choice.ruleLines).toEqual(
      expect.arrayContaining([
        { axis: 'row', ord: 1, line: 'thick' },
        { axis: 'row', ord: 4, line: 'double' },
        { axis: 'col', ord: 1, line: 'none' },
      ])
    );
  });

  it('composes a right index and zebra rows independently of the family', () => {
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
    fireEvent.click(screen.getByRole('radio', { name: 'Matrix' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Rechts' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Zebrastreifen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Layout übernehmen' }));
    expect(onLayoutApply).toHaveBeenCalledWith(
      expect.objectContaining({ headerCols: 0, trailingHeaderCols: 1, banded: true })
    );
  });

  it('renders footer rows in tfoot, index columns as row headers and recorded lines', () => {
    const table = region.table;
    if (!table) throw new Error('fixture');
    render(
      <CorrectedTableCard
        region={{
          ...region,
          table: {
            ...table,
            headerRows: 1,
            footerRows: 1,
            trailingHeaderCols: 1,
            rules: table.rules.map((rule) =>
              rule.axis === 'row' && rule.ord === 4 ? { ...rule, line: 'double' as const } : rule
            ),
          },
        }}
        index={0}
        active
        onSelect={vi.fn()}
      />
    );
    const sum = screen.getByDisplayValue('Summe').closest('td');
    expect(sum?.closest('tfoot')).toBeTruthy();
    expect(sum?.getAttribute('data-bb')).toBe('double');
    expect(
      screen.getByLabelText('Zelle Zeile 2 Spalte 3').closest('th')?.getAttribute('scope')
    ).toBe('row');
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
