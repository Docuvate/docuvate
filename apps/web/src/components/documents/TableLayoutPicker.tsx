// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto, DocumentRegionTableMergeDto } from '@docuvate/contracts';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  applyTableLayout,
  matchingTableLayout,
  mergeAt,
  TABLE_LAYOUTS,
  type TableLayout,
  toggleTableMerge,
} from '../../lib/tableLayouts';
import { Button } from '../ui/Button';

const CELL_W = 12;
const CELL_H = 8;

interface GridSize {
  rows: number;
  cols: number;
}

interface TableSketchProps {
  grid: GridSize;
  headerRows: number;
  headerCols: number;
  merges: readonly DocumentRegionTableMergeDto[];
}

/** Schematic preview drawn from the layout data itself (headers shaded, spans merged). */
function TableSketch({ grid, headerRows, headerCols, merges }: TableSketchProps) {
  const cells: { key: string; x: number; y: number; w: number; h: number; header: boolean }[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const merge = mergeAt(merges, row, col);
      if (merge && (merge.row0 !== row || merge.col0 !== col)) continue;
      cells.push({
        key: `${String(row)}:${String(col)}`,
        x: col * CELL_W,
        y: row * CELL_H,
        w: (merge?.colSpan ?? 1) * CELL_W,
        h: (merge?.rowSpan ?? 1) * CELL_H,
        header: row < headerRows || col < headerCols,
      });
    }
  }
  return (
    <svg
      className="table-sketch"
      viewBox={`-1 -1 ${String(grid.cols * CELL_W + 2)} ${String(grid.rows * CELL_H + 2)}`}
      aria-hidden
      focusable="false"
    >
      {cells.map((cell) => (
        <rect
          key={cell.key}
          className={`table-sketch-cell${cell.header ? ' table-sketch-cell--header' : ''}`}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
        />
      ))}
    </svg>
  );
}

export interface TableStructureChoice {
  tableType: DocumentRegionTableDto['tableType'];
  headerRows: number;
  headerCols: number;
  merges: DocumentRegionTableMergeDto[];
}

interface TableLayoutPickerProps {
  table: DocumentRegionTableDto;
  grid: GridSize;
  busy?: boolean;
  onApply: (choice: TableStructureChoice) => void;
  onCancel: () => void;
}

/**
 * Pick a named layout for a recognised table (common ones first), then adjust merged cells on the
 * real grid: select a cell, then Shift+click (or press M on) a second cell to merge the area.
 */
export function TableLayoutPicker({
  table,
  grid,
  busy = false,
  onApply,
  onCancel,
}: TableLayoutPickerProps) {
  const { t } = useTranslation();
  const groupName = useId();
  const current = matchingTableLayout(table, grid);
  const [showAll, setShowAll] = useState(current?.tier === 'more');
  const [choice, setChoice] = useState<TableStructureChoice>({
    tableType: table.tableType,
    headerRows: table.headerRows,
    headerCols: table.headerCols,
    merges: table.merges.map((merge) => ({ ...merge })),
  });
  const [layoutId, setLayoutId] = useState(current?.id ?? null);
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null);
  const visible = TABLE_LAYOUTS.filter((entry) => showAll || entry.tier === 'common');

  function choose(layout: TableLayout) {
    setLayoutId(layout.id);
    setChoice(applyTableLayout(layout, grid));
    setAnchor(null);
  }

  function mergeTo(row: number, col: number) {
    if (!anchor) return;
    setChoice((prev) => ({ ...prev, merges: toggleTableMerge(prev.merges, anchor, { row, col }) }));
    setLayoutId(null);
    setAnchor(null);
  }

  return (
    <div className="table-layout-picker" data-testid="table-layout-picker">
      <fieldset className="table-layout-options">
        <legend className="table-layout-legend">{t('tableLayouts.title')}</legend>
        {visible.map((entry) => {
          const preview = applyTableLayout(entry, entry.sketch);
          return (
            <label
              key={entry.id}
              className={`table-layout-option${entry.id === layoutId ? ' table-layout-option--active' : ''}`}
              data-layout-id={entry.id}
            >
              <input
                type="radio"
                name={groupName}
                value={entry.id}
                checked={entry.id === layoutId}
                onChange={() => {
                  choose(entry);
                }}
              />
              <TableSketch
                grid={entry.sketch}
                headerRows={preview.headerRows}
                headerCols={preview.headerCols}
                merges={preview.merges}
              />
              <span className="table-layout-name">{t(`tableLayouts.names.${entry.id}`)}</span>
            </label>
          );
        })}
      </fieldset>
      {!showAll ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowAll(true);
          }}
        >
          {t('tableLayouts.more')}
        </Button>
      ) : null}

      <div className="table-layout-merge">
        <p className="table-layout-merge-hint">{t('tableLayouts.mergeHint')}</p>
        <div
          className="table-layout-merge-grid"
          role="group"
          aria-label={t('tableLayouts.mergeAria')}
          style={{
            gridTemplateColumns: `repeat(${String(grid.cols)}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${String(grid.rows)}, auto)`,
          }}
        >
          {Array.from({ length: grid.rows }, (_, row) =>
            Array.from({ length: grid.cols }, (_unused, col) => {
              const merge = mergeAt(choice.merges, row, col);
              if (merge && (merge.row0 !== row || merge.col0 !== col)) return null;
              const rowSpan = merge?.rowSpan ?? 1;
              const colSpan = merge?.colSpan ?? 1;
              const header = row < choice.headerRows || col < choice.headerCols;
              const isAnchor = anchor?.row === row && anchor.col === col;
              return (
                <button
                  key={`${String(row)}:${String(col)}`}
                  type="button"
                  className={`table-layout-merge-cell${header ? ' table-layout-merge-cell--header' : ''}${isAnchor ? ' table-layout-merge-cell--anchor' : ''}`}
                  style={{
                    gridRow: `${String(row + 1)} / span ${String(rowSpan)}`,
                    gridColumn: `${String(col + 1)} / span ${String(colSpan)}`,
                  }}
                  data-cell={`${String(row)}:${String(col)}`}
                  aria-pressed={isAnchor}
                  aria-label={t('tableLayouts.cellAria', {
                    row: row + 1,
                    col: col + 1,
                    rowSpan,
                    colSpan,
                  })}
                  onClick={(event) => {
                    if (event.shiftKey && anchor) {
                      mergeTo(row, col);
                      return;
                    }
                    setAnchor(isAnchor ? null : { row, col });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'm' || event.key === 'M') {
                      event.preventDefault();
                      mergeTo(row, col);
                    }
                  }}
                >
                  {rowSpan > 1 || colSpan > 1 ? t('tableLayouts.span', { rowSpan, colSpan }) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="table-layout-actions">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            onApply(choice);
          }}
        >
          {t('tableLayouts.apply')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
