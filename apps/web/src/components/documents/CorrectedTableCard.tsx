// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  DocumentRegionTableDto,
  DocumentRegionTableRuleLineDto,
  TableBand,
  TableRuleLine,
} from '@docuvate/contracts';
import { isTableIndexCol, tableRowBand } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import {
  mergeAt,
  TABLE_ROW_KINDS,
  type TableRowKind,
  tableRowKind,
  tableStructureOf,
  type TableStructureChoice,
  upsertTableCell,
} from '../../lib/tableLayouts';
import { useTableStructureEditorContext } from './table/TableStructureEditorContext';
import { TableStructureTools } from './table/TableStructureTools';
import { useTableStructureEditor } from './table/useTableStructureEditor';

const BANDS: readonly TableBand[] = ['header', 'body', 'footer'];
const BAND_SECTION = { header: 'thead', body: 'tbody', footer: 'tfoot' } as const;

interface Cell {
  row: number;
  col: number;
}

/** Recorded line on a rule; undefined (default look) while nothing was observed or set. */
function lineAt(
  lines: readonly DocumentRegionTableRuleLineDto[],
  axis: 'row' | 'col',
  ord: number
): Exclude<TableRuleLine, 'unknown'> | undefined {
  const line = lines.find((rule) => rule.axis === axis && rule.ord === ord)?.line;
  return line === undefined || line === 'unknown' ? undefined : line;
}

function between(value: number, a: number, b: number): boolean {
  return value - Math.min(a, b) >= 0 && Math.max(a, b) - value >= 0;
}

function inRange(cell: Cell, a: Cell, b: Cell): boolean {
  return between(cell.row, a.row, b.row) && between(cell.col, a.col, b.col);
}

interface CorrectedTableCardProps {
  region: DocumentRegionDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  /** Open the spatial table overlay on the PDF (resize frame + cell pick). */
  onEditInDocument?: () => void;
  /** Re-infer row/col rules from the current frame on the document. */
  onRedetect?: () => void;
  onCellChange?: (row: number, col: number, text: string) => void;
  /** Bands, index columns, row roles, spans and lines in one correction. */
  onLayoutApply?: (choice: TableStructureChoice) => void;
}

/**
 * A recognised table you edit in place: cell text directly, row kinds in the row gutter, spans by
 * selecting cells. Structure tools live in the context ribbon when the layout workspace shares draft state.
 */
export function CorrectedTableCard({
  region,
  index,
  active,
  onSelect,
  onEditInDocument,
  onRedetect,
  onCellChange,
  onLayoutApply,
}: CorrectedTableCardProps) {
  const table = region.table;
  if (!table) {
    return null;
  }
  return (
    <TableEditor
      key={`${region.id}:${JSON.stringify(tableStructureOf(table))}`}
      region={region}
      table={table}
      index={index}
      active={active}
      onSelect={onSelect}
      onEditInDocument={onEditInDocument}
      onRedetect={onRedetect}
      onCellChange={onCellChange}
      onLayoutApply={onLayoutApply}
    />
  );
}

function TableEditor({
  region,
  table,
  index,
  active,
  onSelect,
  onEditInDocument,
  onRedetect,
  onCellChange,
  onLayoutApply,
}: CorrectedTableCardProps & { table: DocumentRegionTableDto }) {
  const { t } = useTranslation();
  const sharedCtx = useTableStructureEditorContext();
  // Provider holds the *selected* table only — never apply its draft to other cards.
  const shared = sharedCtx?.region.id === region.id ? sharedCtx : null;
  const local = useTableStructureEditor(region, table);
  const editor = shared ?? local;
  const structureToolsInRibbon = shared !== null;
  const editable = onLayoutApply !== undefined;

  const {
    draft,
    setDraft,
    workingTable,
    grid,
    dirty,
    shape,
    lines,
    anchor,
    setAnchor,
    setExtent,
    rangeEnd,
    setRowKind,
    onCellKeyDown,
  } = editor;

  const showInlineTools = editable && !structureToolsInRibbon;

  const kindLabel = (kind: TableRowKind) => t(`tableLayouts.rowKinds.${kind}`);

  return (
    <section
      className={`layout-table-card${active ? ' layout-table-card-active' : ''}${dirty ? ' layout-table-card--draft' : ''}${structureToolsInRibbon ? ' layout-table-card--ribbon-tools' : ''}`}
      data-testid="corrected-table-card"
      data-layout-overlay-target={`region-table-${region.id}`}
    >
      <div className="layout-table-card-bar">
        <button type="button" className="layout-table-card-head" onClick={onSelect}>
          <span className="layout-table-card-title">
            {t('documents.layoutCorrectedTableLabel', { n: index + 1 })}
          </span>
          <span className="muted">
            {t('documents.layoutTableMeta', { rows: grid.rows, cols: grid.cols })}
          </span>
        </button>
        {dirty ? <span className="layout-table-draft-badge">{t('tableLayouts.draft')}</span> : null}
      </div>

      {structureToolsInRibbon ? (
        <p className="layout-table-card-state muted" data-testid="table-card-state-hint">
          {t('tableLayouts.toolsInRibbonHint')}
        </p>
      ) : null}

      {showInlineTools ? (
        <TableStructureTools
          editor={editor}
          index={index}
          placement="card"
          onLayoutApply={onLayoutApply}
          onEditInDocument={onEditInDocument}
          onRedetect={onRedetect}
        />
      ) : null}

      <div className="layout-table-scroll">
        <table
          className={`layout-data-table layout-data-table-editable${draft.banded ? ' layout-data-table--banded' : ''}`}
        >
          {BANDS.map((band) => {
            const rows = Array.from({ length: grid.rows }, (_, row) => row).filter(
              (row) => tableRowBand(shape, row) === band
            );
            if (rows.length === 0) return null;
            const Section = BAND_SECTION[band];
            return (
              <Section key={band}>
                {rows.map((row) => {
                  const kind = tableRowKind(draft, grid, row);
                  return (
                    <tr
                      key={row}
                      data-row-role={draft.rowRoles.find((entry) => entry.row === row)?.role}
                    >
                      {editable ? (
                        <td className="layout-table-gutter">
                          <select
                            className={`table-row-kind table-row-kind--${kind}`}
                            value={kind}
                            aria-label={t('tableLayouts.rowKindAria', { row: row + 1 })}
                            onChange={(event) => {
                              const next = TABLE_ROW_KINDS.find(
                                (item) => item === event.target.value
                              );
                              if (next) setRowKind(row, next);
                            }}
                          >
                            {TABLE_ROW_KINDS.map((option) => (
                              <option key={option} value={option}>
                                {kindLabel(option)}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : null}
                      {Array.from({ length: grid.cols }, (_, col) => {
                        const merge = mergeAt(draft.merges, row, col);
                        if (merge && (merge.row0 !== row || merge.col0 !== col)) {
                          return null;
                        }
                        const cell = workingTable.cells.find(
                          (item) => item.row === row && item.col === col
                        );
                        const rowSpan = merge?.rowSpan ?? 1;
                        const colSpan = merge?.colSpan ?? 1;
                        const indexCol = isTableIndexCol(shape, col);
                        const Tag = band === 'header' || indexCol ? 'th' : 'td';
                        const here = { row, col };
                        const selected =
                          anchor !== null && rangeEnd !== null && inRange(here, anchor, rangeEnd);
                        return (
                          <Tag
                            key={col}
                            scope={band === 'header' ? 'col' : indexCol ? 'row' : undefined}
                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                            colSpan={colSpan > 1 ? colSpan : undefined}
                            className={selected ? 'is-selected' : undefined}
                            data-bt={lineAt(lines, 'row', row)}
                            data-bb={lineAt(lines, 'row', row + rowSpan)}
                            data-bl={lineAt(lines, 'col', col)}
                            data-br={lineAt(lines, 'col', col + colSpan)}
                          >
                            <input
                              key={`${region.id}-${String(row)}-${String(col)}-${cell?.text ?? ''}`}
                              className="layout-table-cell-input"
                              defaultValue={cell?.text ?? ''}
                              aria-label={t('documents.tableCellAria', {
                                row: row + 1,
                                col: col + 1,
                              })}
                              onMouseDown={(event) => {
                                if (event.shiftKey && anchor) {
                                  event.preventDefault();
                                  setExtent(here);
                                }
                              }}
                              onFocus={() => {
                                if (anchor?.row !== row || anchor.col !== col) {
                                  setAnchor(here);
                                  setExtent(null);
                                }
                              }}
                              onKeyDown={(event) => {
                                onCellKeyDown(event, here);
                              }}
                              onBlur={(event) => {
                                const next = event.target.value;
                                if (next === (cell?.text ?? '')) {
                                  return;
                                }
                                setDraft((prev) => ({
                                  ...prev,
                                  cells: upsertTableCell(prev.cells ?? table.cells, row, col, next),
                                }));
                                onCellChange?.(row, col, next);
                              }}
                            />
                          </Tag>
                        );
                      })}
                    </tr>
                  );
                })}
              </Section>
            );
          })}
        </table>
      </div>
    </section>
  );
}