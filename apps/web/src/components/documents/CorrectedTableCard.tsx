// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  DocumentRegionTableDto,
  TableBand,
  TableRuleLine,
} from '@docuvate/contracts';
import { isTableIndexCol, tableGridSize, tableRowBand } from '@docuvate/contracts';
import { LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { mergeAt } from '../../lib/tableLayouts';
import { TableLayoutPicker, type TableStructureChoice } from './TableLayoutPicker';

const BANDS: readonly TableBand[] = ['header', 'body', 'footer'];
const BAND_SECTION = { header: 'thead', body: 'tbody', footer: 'tfoot' } as const;

/** Recorded line on a rule; undefined (default look) while nothing was observed or set. */
function lineAt(
  table: DocumentRegionTableDto,
  axis: 'row' | 'col',
  ord: number
): Exclude<TableRuleLine, 'unknown'> | undefined {
  const line = table.rules.find((rule) => rule.axis === axis && rule.ord === ord)?.line;
  return line === undefined || line === 'unknown' ? undefined : line;
}

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
      <div className="layout-table-card-bar">
        <button type="button" className="layout-table-card-head" onClick={onSelect}>
          <span className="layout-table-card-title">
            {t('documents.layoutCorrectedTableLabel', { n: index + 1 })}
          </span>
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
      </div>
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
        <table
          className={`layout-data-table layout-data-table-editable${table.banded ? ' layout-data-table--banded' : ''}`}
        >
          {BANDS.map((band) => {
            const rows = Array.from({ length: rowCount }, (_, row) => row).filter(
              (row) => tableRowBand({ ...grid, ...table }, row) === band
            );
            if (rows.length === 0) return null;
            const Section = BAND_SECTION[band];
            return (
              <Section key={band}>
                {rows.map((row) => (
                  <tr
                    key={row}
                    data-row-role={table.rowRoles.find((entry) => entry.row === row)?.role}
                  >
                    {Array.from({ length: colCount }, (_, col) => {
                      const merge = mergeAt(table.merges, row, col);
                      if (merge && (merge.row0 !== row || merge.col0 !== col)) {
                        return null;
                      }
                      const cell = table.cells.find((item) => item.row === row && item.col === col);
                      const rowSpan = merge?.rowSpan ?? 1;
                      const colSpan = merge?.colSpan ?? 1;
                      const index = isTableIndexCol({ ...grid, ...table }, col);
                      const isHeader = band === 'header' || index;
                      const Tag = isHeader ? 'th' : 'td';
                      return (
                        <Tag
                          key={col}
                          scope={band === 'header' ? 'col' : index ? 'row' : undefined}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          colSpan={colSpan > 1 ? colSpan : undefined}
                          data-bt={lineAt(table, 'row', row)}
                          data-bb={lineAt(table, 'row', row + rowSpan)}
                          data-bl={lineAt(table, 'col', col)}
                          data-br={lineAt(table, 'col', col + colSpan)}
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
              </Section>
            );
          })}
        </table>
      </div>
    </section>
  );
}
