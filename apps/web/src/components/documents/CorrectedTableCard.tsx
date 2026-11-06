// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { tableGridSize } from '@docuvate/contracts';
import { LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { mergeAt } from '../../lib/tableLayouts';
import { TableLayoutPicker, type TableStructureChoice } from './TableLayoutPicker';

interface CorrectedTableCardProps {
  region: DocumentRegionDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHeaderChange?: (headerRows: number, headerCols: number) => void;
  onCellChange?: (row: number, col: number, text: string) => void;
  /** Layout, header bands and merged cells in one correction. */
  onLayoutApply?: (choice: TableStructureChoice) => void;
}

export function CorrectedTableCard({
  region,
  index,
  active,
  onSelect,
  onHeaderChange,
  onCellChange,
  onLayoutApply,
}: CorrectedTableCardProps) {
  const { t } = useTranslation();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const table = region.table;
  if (!table) {
    return null;
  }
  const grid = tableGridSize(table);
  const colCount = grid.cols;
  const rowCount = grid.rows;
  return (
    <section
      className={`layout-table-card${active ? ' layout-table-card-active' : ''}`}
      data-testid="corrected-table-card"
      data-layout-overlay-target={`region-table-${region.id}`}
    >
      <button type="button" className="layout-table-card-head" onClick={onSelect}>
        <span>{t('documents.layoutCorrectedTableLabel', { n: index + 1 })}</span>
        <span className="muted">
          {t('documents.layoutTableMeta', {
            rows: rowCount,
            cols: colCount,
          })}
        </span>
      </button>
      {onLayoutApply ? (
        <button
          type="button"
          className="layout-table-layout-toggle"
          aria-expanded={layoutOpen}
          aria-label={t('tableLayouts.chooseAria', { n: index + 1 })}
          onClick={() => {
            setLayoutOpen((open) => !open);
          }}
        >
          <LayoutTemplate size={14} aria-hidden />
          {t('tableLayouts.choose')}
        </button>
      ) : null}
      {onLayoutApply && layoutOpen ? (
        <TableLayoutPicker
          table={table}
          grid={grid}
          onApply={(choice) => {
            onLayoutApply(choice);
            setLayoutOpen(false);
          }}
          onCancel={() => {
            setLayoutOpen(false);
          }}
        />
      ) : null}
      <div className="layout-table-header-controls">
        <label className="layout-table-header-stepper">
          <span>{t('documents.tableHeaderRows')}</span>
          <input
            type="number"
            min={0}
            max={Math.max(0, rowCount)}
            value={table.headerRows}
            aria-label={t('documents.tableHeaderRows')}
            onChange={(event) => {
              onHeaderChange?.(Number(event.target.value), table.headerCols);
            }}
          />
        </label>
        <label className="layout-table-header-stepper">
          <span>{t('documents.tableHeaderCols')}</span>
          <input
            type="number"
            min={0}
            max={Math.max(0, colCount)}
            value={table.headerCols}
            aria-label={t('documents.tableHeaderCols')}
            onChange={(event) => {
              onHeaderChange?.(table.headerRows, Number(event.target.value));
            }}
          />
        </label>
      </div>
      <div className="layout-table-scroll">
        <table className="layout-data-table layout-data-table-editable">
          <tbody>
            {Array.from({ length: rowCount }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: colCount }, (_, col) => {
                  const merge = mergeAt(table.merges, row, col);
                  if (merge && (merge.row0 !== row || merge.col0 !== col)) {
                    return null;
                  }
                  const cell = table.cells.find((item) => item.row === row && item.col === col);
                  const isHeader = row < table.headerRows || col < table.headerCols;
                  const Tag = isHeader ? 'th' : 'td';
                  return (
                    <Tag
                      key={col}
                      scope={isHeader && row < table.headerRows ? 'col' : undefined}
                      rowSpan={merge && merge.rowSpan > 1 ? merge.rowSpan : undefined}
                      colSpan={merge && merge.colSpan > 1 ? merge.colSpan : undefined}
                    >
                      <input
                        key={`${region.id}-${String(row)}-${String(col)}-${cell?.text ?? ''}`}
                        className="layout-table-cell-input"
                        defaultValue={cell?.text ?? ''}
                        aria-label={t('documents.tableCellAria', {
                          row: row + 1,
                          col: col + 1,
                        })}
                        onBlur={(event) => {
                          const next = event.target.value;
                          if (next === (cell?.text ?? '')) {
                            return;
                          }
                          onCellChange?.(row, col, next);
                        }}
                      />
                    </Tag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
