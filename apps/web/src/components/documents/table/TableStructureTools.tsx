// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Combine, RefreshCw, SlidersHorizontal, Split } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import {
  deleteTableCol,
  deleteTableRow,
  distributeTableAxis,
  downloadTableCsv,
  insertTableCol,
  insertTableRow,
  tableDraftToCsv,
} from '../../../lib/tableGridOps';
import {
  familyDesign,
  MAX_BAND_ROWS,
  TABLE_INDEX_POSITIONS,
  TABLE_RULING_CHOICES,
  type TableStructureChoice,
} from '../../../lib/tableLayouts';
import { Button } from '../../ui/Button';
import { TableFamilyMenu } from './TableFamilyMenu';
import { type TableStructureEditorState } from './useTableStructureEditor';

interface StepperProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

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
          aria-label={`${label}: ${t('tableLayouts.less')}`}
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
          aria-label={`${label}: ${t('tableLayouts.more')}`}
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

type TableStructureToolsPlacement = 'ribbon' | 'card';

interface TableStructureToolsProps {
  editor: TableStructureEditorState;
  index: number;
  placement: TableStructureToolsPlacement;
  onLayoutApply?: (choice: TableStructureChoice) => void;
  onEditInDocument?: () => void;
  onRedetect?: () => void;
  documentEditOpen?: boolean;
  onSaveDocumentBounds?: () => void;
  onExitDocumentEdit?: () => void;
}

/**
 * Structure toolbar: template, bands, grid ops, apply. Rendered in the ribbon or inline on sheets.
 */
export function TableStructureTools({
  editor,
  index,
  placement,
  onLayoutApply,
  onEditInDocument,
  onRedetect,
  documentEditOpen = false,
  onSaveDocumentBounds,
  onExitDocumentEdit,
}: TableStructureToolsProps) {
  const { t } = useTranslation();
  const toolsId = useId();
  const {
    table,
    draft,
    design,
    moreOpen,
    setMoreOpen,
    anchor,
    grid,
    dirty,
    valid,
    applyGridDraft,
    applyDesign,
    toggleMerge,
    resetDraft,
    multi,
    anchorMerge,
    setDraft,
    setDesign,
  } = editor;
  const editable = onLayoutApply !== undefined;
  if (!editable) {
    return null;
  }

  const showEditInDocument = onEditInDocument != null && !documentEditOpen;

  return (
    <div
      className={`table-tools${placement === 'ribbon' ? ' table-tools--ribbon' : ''}`}
      role="toolbar"
      aria-label={t('tableLayouts.toolbarAria', { n: index + 1 })}
      data-testid="table-structure-tools"
      data-placement={placement}
    >
      <div className="table-tools-row">
        <div className="table-tool-field">
          <span className="table-tool-label">{t('tableLayouts.template')}</span>
          <TableFamilyMenu
            value={design.family}
            onChange={(family) => {
              applyDesign(familyDesign(family));
            }}
          />
        </div>
        {showEditInDocument ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="table-edit-in-document"
            onClick={onEditInDocument}
          >
            {t('tableLayouts.editInDocument')}
          </Button>
        ) : null}
        {documentEditOpen && onSaveDocumentBounds ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="table-overlay-save-bounds"
            onClick={onSaveDocumentBounds}
          >
            {t('tableLayouts.saveBounds')}
          </Button>
        ) : null}
        {documentEditOpen && onExitDocumentEdit ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="table-overlay-close"
            onClick={onExitDocumentEdit}
          >
            {t('tableLayouts.exitDocumentEdit')}
          </Button>
        ) : null}
        {onRedetect ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="table-redetect-grid"
            onClick={onRedetect}
          >
            <RefreshCw size={14} aria-hidden />
            {t('tableLayouts.redetectGrid')}
          </Button>
        ) : null}
        <Stepper
          label={t('documents.tableHeaderRows')}
          value={draft.headerRows}
          max={Math.min(MAX_BAND_ROWS, Math.max(0, grid.rows - 1))}
          onChange={(headerLevels) => {
            applyDesign({ ...design, headerLevels });
          }}
        />
        <Stepper
          label={t('documents.tableHeaderCols')}
          value={draft.headerCols}
          max={Math.min(MAX_BAND_ROWS, Math.max(0, grid.cols - 1))}
          onChange={(headerCols) => {
            setDraft((prev) => ({ ...prev, headerCols }));
            setDesign((prev) => ({
              ...prev,
              index: headerCols > 0 ? (prev.index === 'none' ? 'left' : prev.index) : 'none',
            }));
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
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-insert-row"
          onClick={() => {
            applyGridDraft(insertTableRow(table, draft, anchor?.row ?? grid.rows));
          }}
        >
          {t('tableLayouts.insertRow')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-insert-col"
          onClick={() => {
            applyGridDraft(insertTableCol(table, draft, anchor?.col ?? grid.cols));
          }}
        >
          {t('tableLayouts.insertCol')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-delete-row"
          disabled={grid.rows <= 1 || anchor === null}
          onClick={() => {
            if (anchor) applyGridDraft(deleteTableRow(table, draft, anchor.row));
          }}
        >
          {t('tableLayouts.deleteRow')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-delete-col"
          disabled={grid.cols <= 1 || anchor === null}
          onClick={() => {
            if (anchor) applyGridDraft(deleteTableCol(table, draft, anchor.col));
          }}
        >
          {t('tableLayouts.deleteCol')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-distribute-rows"
          onClick={() => {
            applyGridDraft(distributeTableAxis(table, draft, 'row'));
          }}
        >
          {t('tableLayouts.distributeRows')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-distribute-cols"
          onClick={() => {
            applyGridDraft(distributeTableAxis(table, draft, 'col'));
          }}
        >
          {t('tableLayouts.distributeCols')}
        </button>
        <button
          type="button"
          className="table-tool-btn"
          data-testid="table-export-csv"
          onClick={() => {
            const sep = t('tableLayouts.csvSeparator');
            downloadTableCsv(
              `table-${String(index + 1)}.csv`,
              tableDraftToCsv(table, draft, sep === ',' ? ',' : ';')
            );
          }}
        >
          {t('tableLayouts.exportCsv')}
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
              onClick={resetDraft}
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
              const position = TABLE_INDEX_POSITIONS.find((item) => item === event.target.value);
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
      {placement === 'card' ? (
        <p className="table-tools-hint">{t('tableLayouts.directHint')}</p>
      ) : null}
    </div>
  );
}