// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableDto, TableIndexPosition } from '@docuvate/contracts';
import { tableRowBand, validTableStructure } from '@docuvate/contracts';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  cycleRowRole,
  designTable,
  familyDesign,
  type GridSize,
  MAX_BAND_ROWS,
  mergeAt,
  TABLE_FAMILIES,
  TABLE_INDEX_POSITIONS,
  TABLE_RULING_CHOICES,
  type TableDesign,
  tableDesignOf,
  type TableFamily,
  type TableRulingChoice,
  type TableStructureChoice,
  toggleTableMerge,
} from '../../lib/tableLayouts';
import { Button } from '../ui/Button';
import { TableSketch } from './TableSketch';

export type { TableStructureChoice } from '../../lib/tableLayouts';

const FAMILY_SKETCH: Record<TableFamily, GridSize> = {
  simple: { rows: 4, cols: 4 },
  matrix: { rows: 4, cols: 4 },
  nested: { rows: 5, cols: 5 },
  financial: { rows: 6, cols: 4 },
  grouped: { rows: 7, cols: 4 },
  key_value: { rows: 4, cols: 2 },
};
const BAND_COUNTS = Array.from({ length: MAX_BAND_ROWS + 1 }, (_, count) => count);

interface ChoiceGroupProps<T extends string | number> {
  legend: string;
  options: readonly T[];
  value: T;
  label: (option: T) => string;
  onChange: (option: T) => void;
  name: string;
}

/** Compact segmented radio group (one accessible fieldset per dimension). */
function ChoiceGroup<T extends string | number>({
  legend,
  options,
  value,
  label,
  onChange,
  name,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="table-layout-choice">
      <legend>{legend}</legend>
      <div className="table-layout-segments">
        {options.map((option) => (
          <label
            key={String(option)}
            className={`table-layout-segment${option === value ? ' table-layout-segment--active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              checked={option === value}
              onChange={() => {
                onChange(option);
              }}
            />
            {label(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function currentLines(table: DocumentRegionTableDto, choice: TableStructureChoice) {
  return choice.ruleLines ?? table.rules.map(({ axis, ord, line }) => ({ axis, ord, line }));
}

interface TableLayoutPickerProps {
  table: DocumentRegionTableDto;
  grid: GridSize;
  busy?: boolean;
  onApply: (choice: TableStructureChoice) => void;
  onCancel: () => void;
}

/**
 * Pick a table family, then adjust the independent dimensions (header levels, index position,
 * footer, sections, lines, zebra) behind "Struktur anpassen". Cell spans and row roles are edited
 * on the real grid last, so common tables take one click and rare ones stay possible.
 */
export function TableLayoutPicker({
  table,
  grid,
  busy = false,
  onApply,
  onCancel,
}: TableLayoutPickerProps) {
  const { t } = useTranslation();
  const name = useId();
  const [design, setDesign] = useState<TableDesign>(() => tableDesignOf(table));
  const [choice, setChoice] = useState<TableStructureChoice>(() => ({
    tableType: table.tableType,
    headerRows: table.headerRows,
    footerRows: table.footerRows,
    headerCols: table.headerCols,
    trailingHeaderCols: table.trailingHeaderCols,
    banded: table.banded,
    rowRoles: table.rowRoles.map((entry) => ({ ...entry })),
    merges: table.merges.map((merge) => ({ ...merge })),
  }));
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null);
  const textAt = (row: number, col: number) =>
    table.cells.find((cell) => cell.row === row && cell.col === col)?.text ?? '';
  const shape = { ...grid, ...choice };

  function update(next: TableDesign) {
    setDesign(next);
    setChoice(designTable(next, grid, table.cells));
    setAnchor(null);
  }

  function mergeTo(row: number, col: number) {
    if (!anchor) return;
    setChoice((prev) => ({ ...prev, merges: toggleTableMerge(prev.merges, anchor, { row, col }) }));
    setAnchor(null);
  }

  return (
    <div className="table-layout-picker" data-testid="table-layout-picker">
      <fieldset className="table-layout-options">
        <legend className="table-layout-legend">{t('tableLayouts.title')}</legend>
        {TABLE_FAMILIES.map((family) => {
          const preview = designTable(familyDesign(family), FAMILY_SKETCH[family]);
          return (
            <label
              key={family}
              className={`table-layout-option${family === design.family ? ' table-layout-option--active' : ''}`}
              data-family={family}
            >
              <input
                type="radio"
                name={`${name}-family`}
                checked={family === design.family}
                onChange={() => {
                  update(familyDesign(family));
                }}
              />
              <TableSketch
                grid={FAMILY_SKETCH[family]}
                structure={preview}
                lines={preview.ruleLines ?? []}
              />
              <span className="table-layout-name">{t(`tableLayouts.families.${family}`)}</span>
            </label>
          );
        })}
      </fieldset>

      <details className="table-layout-details">
        <summary>{t('tableLayouts.customize')}</summary>
        <div className="table-layout-dimensions">
          <ChoiceGroup
            name={`${name}-header`}
            legend={t('tableLayouts.headerLevels')}
            options={BAND_COUNTS}
            value={design.headerLevels}
            label={String}
            onChange={(headerLevels) => {
              update({ ...design, headerLevels });
            }}
          />
          <ChoiceGroup<TableIndexPosition>
            name={`${name}-index`}
            legend={t('tableLayouts.index')}
            options={TABLE_INDEX_POSITIONS}
            value={design.index}
            label={(option) => t(`tableLayouts.indexOptions.${option}`)}
            onChange={(index) => {
              update({ ...design, index });
            }}
          />
          <ChoiceGroup
            name={`${name}-footer`}
            legend={t('tableLayouts.footerRows')}
            options={BAND_COUNTS}
            value={design.footerRows}
            label={String}
            onChange={(footerRows) => {
              update({ ...design, footerRows });
            }}
          />
          <ChoiceGroup<TableRulingChoice>
            name={`${name}-ruling`}
            legend={t('tableLayouts.ruling')}
            options={TABLE_RULING_CHOICES}
            value={design.ruling}
            label={(option) => t(`tableLayouts.rulingOptions.${option}`)}
            onChange={(ruling) => {
              update({ ...design, ruling });
            }}
          />
          <div className="table-layout-toggles">
            <label className="table-layout-check">
              <input
                type="checkbox"
                checked={design.grouped}
                onChange={(event) => {
                  update({ ...design, grouped: event.target.checked });
                }}
              />
              {t('tableLayouts.grouped')}
            </label>
            <label className="table-layout-check">
              <input
                type="checkbox"
                checked={design.banded}
                onChange={(event) => {
                  update({ ...design, banded: event.target.checked });
                }}
              />
              {t('tableLayouts.banded')}
            </label>
          </div>
        </div>
      </details>

      <div className="table-layout-preview" data-testid="table-layout-preview">
        <TableSketch
          className="table-sketch--large"
          grid={grid}
          structure={choice}
          lines={currentLines(table, choice)}
        />
        <span className="muted">
          {t('tableLayouts.preview', { rows: grid.rows, cols: grid.cols })}
        </span>
      </div>

      <details className="table-layout-details">
        <summary>{t('tableLayouts.cellsTitle')}</summary>
        <div className="table-layout-merge">
          <p className="table-layout-merge-hint">{t('tableLayouts.mergeHint')}</p>
          <div
            className="table-layout-merge-grid"
            role="group"
            aria-label={t('tableLayouts.mergeAria')}
            style={{
              gridTemplateColumns: `auto repeat(${String(grid.cols)}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${String(grid.rows)}, auto)`,
            }}
          >
            {Array.from({ length: grid.rows }, (_, row) => {
              const band = tableRowBand(shape, row);
              const role = choice.rowRoles.find((entry) => entry.row === row)?.role ?? 'data';
              const roleLabel = t(`tableLayouts.rowRoles.${band === 'body' ? role : band}`);
              return [
                <button
                  key={`role:${String(row)}`}
                  type="button"
                  className={`table-layout-row-role table-layout-row-role--${band === 'body' ? role : band}`}
                  style={{ gridRow: String(row + 1), gridColumn: '1' }}
                  disabled={band !== 'body'}
                  aria-label={t('tableLayouts.rowRoleAria', { row: row + 1, role: roleLabel })}
                  onClick={() => {
                    setChoice((prev) => ({ ...prev, rowRoles: cycleRowRole(prev.rowRoles, row) }));
                  }}
                >
                  {roleLabel}
                </button>,
                ...Array.from({ length: grid.cols }, (_unused, col) => {
                  const merge = mergeAt(choice.merges, row, col);
                  if (merge && (merge.row0 !== row || merge.col0 !== col)) return null;
                  const rowSpan = merge?.rowSpan ?? 1;
                  const colSpan = merge?.colSpan ?? 1;
                  const header =
                    band === 'header' ||
                    col < choice.headerCols ||
                    col >= grid.cols - choice.trailingHeaderCols;
                  const isAnchor = anchor?.row === row && anchor.col === col;
                  return (
                    <button
                      key={`${String(row)}:${String(col)}`}
                      type="button"
                      className={`table-layout-merge-cell${header ? ' table-layout-merge-cell--header' : ''}${band === 'footer' ? ' table-layout-merge-cell--footer' : ''}${isAnchor ? ' table-layout-merge-cell--anchor' : ''}`}
                      style={{
                        gridRow: `${String(row + 1)} / span ${String(rowSpan)}`,
                        gridColumn: `${String(col + 2)} / span ${String(colSpan)}`,
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
                      <span className="table-layout-merge-text">{textAt(row, col)}</span>
                      {rowSpan > 1 || colSpan > 1 ? (
                        <span className="table-layout-merge-span">
                          {t('tableLayouts.span', { rowSpan, colSpan })}
                        </span>
                      ) : null}
                    </button>
                  );
                }),
              ];
            })}
          </div>
        </div>
      </details>

      <div className="table-layout-actions">
        <Button
          type="button"
          size="sm"
          disabled={busy || !validTableStructure(shape)}
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
