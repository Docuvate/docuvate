// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  DocumentRegionTableDto,
  DocumentRegionTableRuleLineDto,
  TableBand,
  TableRuleLine,
} from '@docuvate/contracts';
import {
  isTableIndexCol,
  tableGridSize,
  tableRowBand,
  validTableStructure,
} from '@docuvate/contracts';
import { Combine, SlidersHorizontal, Split } from 'lucide-react';
import { type KeyboardEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  designTable,
  familyDesign,
  type GridSize,
  MAX_BAND_ROWS,
  mergeAt,
  TABLE_FAMILIES,
  TABLE_INDEX_POSITIONS,
  TABLE_ROW_KINDS,
  TABLE_RULING_CHOICES,
  type TableDesign,
  tableDesignOf,
  type TableFamily,
  type TableRowKind,
  tableRowKind,
  type TableStructureChoice,
  tableStructureOf,
  toggleTableMerge,
  withRowKind,
} from '../../lib/tableLayouts';
import { Button } from '../ui/Button';

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

function sameStructure(a: TableStructureChoice, b: TableStructureChoice): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function between(value: number, a: number, b: number): boolean {
  return value - Math.min(a, b) >= 0 && Math.max(a, b) - value >= 0;
}

function inRange(cell: Cell, a: Cell, b: Cell): boolean {
  return between(cell.row, a.row, b.row) && between(cell.col, a.col, b.col);
}

interface StepperProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

/** − n + with a real number input, so the value can also be typed. */
function Stepper({ label, value, max, onChange }: StepperProps) {
  const { t } = useTranslation();
  const set = (next: number) => {
    onChange(Math.max(0, Math.min(max, next)));
  };
  return (
    <div className="table-tool-stepper" role="group" aria-label={label}>
      <span className="table-tool-label">{label}</span>
      <span className="table-tool-stepper-box">
        <button
          type="button"
          aria-label={t('tableLayouts.less')}
          disabled={value <= 0}
          onClick={() => {
            set(value - 1);
          }}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          aria-label={label}
          onChange={(event) => {
            set(Number(event.target.value));
          }}
        />
        <button
          type="button"
          aria-label={t('tableLayouts.more')}
          disabled={value >= max}
          onClick={() => {
            set(value + 1);
          }}
        >
          +
        </button>
      </span>
    </div>
  );
}

interface CorrectedTableCardProps {
  region: DocumentRegionDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  onCellChange?: (row: number, col: number, text: string) => void;
  /** Bands, index columns, row roles, spans and lines in one correction. */
  onLayoutApply?: (choice: TableStructureChoice) => void;
}

/**
 * A recognised table you edit in place: cell text directly, row kinds in the row gutter, spans by
 * selecting cells, and the few global choices (template, header and result rows) in one compact
 * toolbar. Structure changes stay a visible draft on the real table until "Übernehmen".
 */
export function CorrectedTableCard({
  region,
  index,
  active,
  onSelect,
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
  onCellChange,
  onLayoutApply,
}: CorrectedTableCardProps & { table: DocumentRegionTableDto }) {
  const { t } = useTranslation();
  const toolsId = useId();
  const grid: GridSize = tableGridSize(table);
  const saved = tableStructureOf(table);
  const [draft, setDraft] = useState<TableStructureChoice>(saved);
  const [design, setDesign] = useState<TableDesign>(() => tableDesignOf(table));
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [extent, setExtent] = useState<Cell | null>(null);
  const editable = onLayoutApply !== undefined;
  const dirty = !sameStructure(draft, saved) || draft.ruleLines !== undefined;
  const shape = { ...grid, ...draft };
  const valid = validTableStructure(shape);
  const lines = draft.ruleLines ?? table.rules.map(({ axis, ord, line }) => ({ axis, ord, line }));
  const rangeEnd = extent ?? anchor;
  const anchorMerge = anchor ? mergeAt(draft.merges, anchor.row, anchor.col) : null;
  const multi =
    anchor !== null &&
    rangeEnd !== null &&
    (anchor.row !== rangeEnd.row || anchor.col !== rangeEnd.col);

  function applyDesign(next: TableDesign) {
    setDesign(next);
    setDraft(designTable(next, grid, table.cells));
    setAnchor(null);
    setExtent(null);
  }

  function setRowKind(row: number, kind: TableRowKind) {
    const next = withRowKind(draft, grid, row, kind);
    setDraft(next);
    setDesign((prev) => ({
      ...prev,
      headerLevels: Math.min(next.headerRows, MAX_BAND_ROWS),
      footerRows: Math.min(next.footerRows, MAX_BAND_ROWS),
      grouped: next.rowRoles.length > 0,
    }));
  }

  function toggleMerge() {
    if (!anchor || !rangeEnd) return;
    const target = multi ? rangeEnd : anchor;
    const merges = multi
      ? toggleTableMerge(draft.merges, anchor, target)
      : anchorMerge
        ? draft.merges.filter((merge) => merge !== anchorMerge)
        : draft.merges;
    setDraft({ ...draft, merges });
    setExtent(null);
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLInputElement>, cell: Cell) {
    if (!event.shiftKey || !event.altKey) return;
    const from = extent ?? cell;
    const step = new Map<string, Cell>([
      ['ArrowRight', { row: from.row, col: Math.min(grid.cols - 1, from.col + 1) }],
      ['ArrowLeft', { row: from.row, col: Math.max(0, from.col - 1) }],
      ['ArrowDown', { row: Math.min(grid.rows - 1, from.row + 1), col: from.col }],
      ['ArrowUp', { row: Math.max(0, from.row - 1), col: from.col }],
    ]);
    const next = step.get(event.key);
    if (!next) return;
    event.preventDefault();
    if (!anchor) setAnchor(cell);
    setExtent(next);
  }

  const kindLabel = (kind: TableRowKind) => t(`tableLayouts.rowKinds.${kind}`);

  return (
    <section
      className={`layout-table-card${active ? ' layout-table-card-active' : ''}${dirty ? ' layout-table-card--draft' : ''}`}
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

      {editable ? (
        <div
          className="table-tools"
          role="toolbar"
          aria-label={t('tableLayouts.toolbarAria', { n: index + 1 })}
          data-testid="table-structure-tools"
        >
          <div className="table-tools-row">
            <label className="table-tool-field">
              <span className="table-tool-label">{t('tableLayouts.template')}</span>
              <select
                className="table-tool-select"
                value={design.family}
                onChange={(event) => {
                  const family = TABLE_FAMILIES.find((item) => item === event.target.value);
                  if (family) applyDesign(familyDesign(family));
                }}
              >
                {TABLE_FAMILIES.map((family: TableFamily) => (
                  <option key={family} value={family}>
                    {t(`tableLayouts.families.${family}`)}
                  </option>
                ))}
              </select>
            </label>
            <Stepper
              label={t('documents.tableHeaderRows')}
              value={draft.headerRows}
              max={Math.min(MAX_BAND_ROWS, Math.max(0, grid.rows - 1))}
              onChange={(headerLevels) => {
                applyDesign({ ...design, headerLevels });
              }}
            />
            <Stepper
              label={t('tableLayouts.footerRows')}
              value={draft.footerRows}
              max={Math.min(MAX_BAND_ROWS, Math.max(0, grid.rows - 1))}
              onChange={(footerRows) => {
                applyDesign({ ...design, footerRows });
              }}
            />
            <button
              type="button"
              className="table-tool-btn"
              aria-expanded={moreOpen}
              aria-controls={toolsId}
              onClick={() => {
                setMoreOpen((open) => !open);
              }}
            >
              <SlidersHorizontal size={14} aria-hidden />
              {t('tableLayouts.appearance')}
            </button>
            <button
              type="button"
              className="table-tool-btn"
              disabled={!anchor || (!multi && !anchorMerge)}
              onClick={toggleMerge}
            >
              {multi || !anchorMerge ? (
                <Combine size={14} aria-hidden />
              ) : (
                <Split size={14} aria-hidden />
              )}
              {multi || !anchorMerge ? t('tableLayouts.mergeCells') : t('tableLayouts.splitCells')}
            </button>
            {dirty ? (
              <span className="table-tools-commit">
                <Button
                  type="button"
                  size="sm"
                  disabled={!valid}
                  onClick={() => {
                    onLayoutApply(draft);
                  }}
                >
                  {t('tableLayouts.apply')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(saved);
                    setDesign(tableDesignOf(table));
                    setAnchor(null);
                    setExtent(null);
                  }}
                >
                  {t('tableLayouts.discard')}
                </Button>
              </span>
            ) : null}
          </div>
          <div className="table-tools-row table-tools-row--more" id={toolsId} hidden={!moreOpen}>
            <label className="table-tool-field">
              <span className="table-tool-label">{t('tableLayouts.index')}</span>
              <select
                className="table-tool-select"
                value={design.index}
                onChange={(event) => {
                  const position = TABLE_INDEX_POSITIONS.find(
                    (item) => item === event.target.value
                  );
                  if (position) applyDesign({ ...design, index: position });
                }}
              >
                {TABLE_INDEX_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {t(`tableLayouts.indexOptions.${position}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="table-tool-field">
              <span className="table-tool-label">{t('tableLayouts.ruling')}</span>
              <select
                className="table-tool-select"
                value={design.ruling}
                onChange={(event) => {
                  const ruling = TABLE_RULING_CHOICES.find((item) => item === event.target.value);
                  if (ruling) applyDesign({ ...design, ruling });
                }}
              >
                {TABLE_RULING_CHOICES.map((ruling) => (
                  <option key={ruling} value={ruling}>
                    {t(`tableLayouts.rulingOptions.${ruling}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="table-tool-check">
              <input
                type="checkbox"
                checked={design.grouped}
                onChange={(event) => {
                  applyDesign({ ...design, grouped: event.target.checked });
                }}
              />
              {t('tableLayouts.grouped')}
            </label>
            <label className="table-tool-check">
              <input
                type="checkbox"
                checked={draft.banded}
                onChange={(event) => {
                  setDesign({ ...design, banded: event.target.checked });
                  setDraft({ ...draft, banded: event.target.checked });
                }}
              />
              {t('tableLayouts.banded')}
            </label>
          </div>
          <p className="table-tools-hint">{t('tableLayouts.directHint')}</p>
        </div>
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
                        const cell = table.cells.find(
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
