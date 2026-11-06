// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentRegionDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import type { TableStructureChoice } from '../../lib/tableLayouts';
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
    expect(screen.queryByRole('button', { name: 'Übernehmen' })).toBeNull();
    fireEvent.click(screen.getByTestId('table-family-menu'));
    fireEvent.click(screen.getByRole('option', { name: /Finanzlayout|Financial/i }));
    // The draft is previewed on the real table before it is applied.
    expect(screen.getByDisplayValue('Summe').closest('tfoot')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
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
    fireEvent.click(screen.getByTestId('table-family-menu'));
    fireEvent.click(screen.getByRole('option', { name: /Matrix/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Darstellung' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Indexspalte' }), {
      target: { value: 'right' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Zebrastreifen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
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

  it('merges cells selected directly on the table', () => {
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
    fireEvent.focus(screen.getByLabelText('Zelle Zeile 1 Spalte 1'));
    fireEvent.mouseDown(screen.getByLabelText('Zelle Zeile 1 Spalte 3'), { shiftKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Zellen verbinden' }));
    expect(
      screen.getByLabelText('Zelle Zeile 1 Spalte 1').closest('td')?.getAttribute('colspan')
    ).toBe('3');
    fireEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(onLayoutApply).toHaveBeenLastCalledWith(
      expect.objectContaining({ merges: [{ row0: 0, col0: 0, rowSpan: 1, colSpan: 3 }] })
    );
  });

  it('re-labels a row from its gutter and discards the draft on demand', () => {
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
    fireEvent.change(screen.getByRole('combobox', { name: 'Zeilenart von Zeile 1' }), {
      target: { value: 'header' },
    });
    expect(screen.getByLabelText('Zelle Zeile 1 Spalte 1').closest('thead')).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: 'Kopfzeilen' })).toHaveProperty('value', '1');
    fireEvent.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(screen.getByLabelText('Zelle Zeile 1 Spalte 1').closest('thead')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Zeilenart von Zeile 4' }), {
      target: { value: 'footer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(onLayoutApply).toHaveBeenCalledWith(expect.objectContaining({ footerRows: 1 }));
  });
});
