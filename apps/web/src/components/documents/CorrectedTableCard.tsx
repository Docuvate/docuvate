// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

export interface CorrectedTableCardProps {
  region: DocumentRegionDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHeaderChange?: (headerRows: number, headerCols: number) => void;
  onCellChange?: (row: number, col: number, text: string) => void;
}

export function CorrectedTableCard({
  region,
  index,
  active,
  onSelect,
  onHeaderChange,
  onCellChange,
}: CorrectedTableCardProps) {
  const { t } = useTranslation();
  const table = region.table;
  if (!table) {
    return null;
  }
  const colCount = table.cells.reduce((max, cell) => Math.max(max, cell.col + 1), 0);
  const rowCount = table.cells.reduce((max, cell) => Math.max(max, cell.row + 1), 0);
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
                  const cell = table.cells.find((item) => item.row === row && item.col === col);
                  const isHeader = row < table.headerRows || col < table.headerCols;
                  const Tag = isHeader ? 'th' : 'td';
                  return (
                    <Tag key={col} scope={isHeader && row < table.headerRows ? 'col' : undefined}>
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
