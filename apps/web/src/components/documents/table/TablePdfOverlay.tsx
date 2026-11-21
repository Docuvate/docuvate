// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  DocumentRegionTableCellDto,
  DocumentRegionTableDto,
  DocumentRegionTableMergeDto,
  DocumentRegionTableRowRoleDto,
  DocumentRegionTableRuleDto,
  NormalizedRect,
} from '@docuvate/contracts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { splitTableBandAtPos } from '../../../lib/tableGridOps';
import { tableStructureOf } from '../../../lib/tableLayouts';
import { clientPointToLocalRatio, findPdfPageWrap } from '../../../lib/viewerGeometry';
import { Button } from '../../ui/Button';
import { ResizableNormalizedRect } from '../ResizableNormalizedRect';

/** Full structure patch from the PDF overlay (drag moves rules only; split adds cells/merges). */
export interface TableOverlayStructureCommit {
  rules: DocumentRegionTableRuleDto[];
  cells?: DocumentRegionTableCellDto[];
  merges?: DocumentRegionTableMergeDto[];
  rowRoles?: DocumentRegionTableRowRoleDto[];
}

interface TablePdfOverlayProps {
  region: DocumentRegionDto;
  table: DocumentRegionTableDto;
  active: boolean;
  /** Clockwise display rotation of the page (0/90/180/270). Overlay mounts inside the
   * rotated `.pdf-page-wrap`, so MediaBox percentages stay valid. */
  pageRotationDeg: number;
  selectedCell: { row: number; col: number } | null;
  onSelectCell: (row: number, col: number) => void;
  onBoundsCommit: (rect: NormalizedRect) => void;
  /** Persist dragged/split row/col dividers. */
  onRulesCommit?: (commit: TableOverlayStructureCommit) => void;
  onClose: () => void;
  onRedetect?: () => void;
}

interface GuideDrag {
  axis: 'row' | 'col';
  ord: number;
  pointerId: number;
}

function sortedAxis(
  rules: readonly DocumentRegionTableRuleDto[],
  axis: 'row' | 'col'
): DocumentRegionTableRuleDto[] {
  return rules.filter((rule) => rule.axis === axis).sort((a, b) => a.ord - b.ord);
}

function clampGuidePos(
  rules: readonly DocumentRegionTableRuleDto[],
  axis: 'row' | 'col',
  ord: number,
  nextPos: number
): number {
  const axisRules = sortedAxis(rules, axis);
  const index = axisRules.findIndex((rule) => rule.ord === ord);
  if (index <= 0 || index >= axisRules.length - 1) return nextPos;
  const prev = axisRules[index - 1] ?? axisRules[0];
  const following = axisRules[index + 1] ?? axisRules[axisRules.length - 1];
  const minGap = 0.004;
  return Math.min(following.pos - minGap, Math.max(prev.pos + minGap, nextPos));
}

/** Spatial table editor anchored to the detected region on the PDF page. */
export function TablePdfOverlay({
  region,
  table,
  active,
  pageRotationDeg,
  selectedCell,
  onSelectCell,
  onBoundsCommit,
  onRulesCommit,
  onClose,
  onRedetect,
}: TablePdfOverlayProps) {
  const { t } = useTranslation();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [draftBounds, setDraftBounds] = useState<NormalizedRect>({
    x0: region.x0,
    y0: region.y0,
    x1: region.x1,
    y1: region.y1,
  });
  const [draftRules, setDraftRules] = useState(table.rules);
  const [draftCells, setDraftCells] = useState(table.cells);
  const draftRulesRef = useRef(draftRules);
  const draftCellsRef = useRef(draftCells);
  const draftMergesRef = useRef(table.merges.map((merge) => ({ ...merge })));
  const draftRowRolesRef = useRef(table.rowRoles.map((entry) => ({ ...entry })));
  const dragRef = useRef<GuideDrag | null>(null);

  useEffect(() => {
    setDraftBounds({ x0: region.x0, y0: region.y0, x1: region.x1, y1: region.y1 });
  }, [region.x0, region.y0, region.x1, region.y1, region.id]);

  useEffect(() => {
    const next = table.rules.map((rule) => ({ ...rule }));
    setDraftRules(next);
    draftRulesRef.current = next;
    const nextCells = table.cells.map((cell) => ({ ...cell }));
    setDraftCells(nextCells);
    draftCellsRef.current = nextCells;
    draftMergesRef.current = table.merges.map((merge) => ({ ...merge }));
    draftRowRolesRef.current = table.rowRoles.map((entry) => ({ ...entry }));
  }, [table.rules, table.cells, table.merges, table.rowRoles, region.id]);

  useEffect(() => {
    if (!active) {
      setHost(null);
      return;
    }
    const sync = () => {
      setHost(findPdfPageWrap(region.page));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [active, region.page, pageRotationDeg]);

  const rowRules = useMemo(() => sortedAxis(draftRules, 'row'), [draftRules]);
  const colRules = useMemo(() => sortedAxis(draftRules, 'col'), [draftRules]);
  const rows = Math.max(0, rowRules.length - 1);
  const cols = Math.max(0, colRules.length - 1);
  const guidesEditable = onRulesCommit !== undefined;

  function moveGuide(axis: 'row' | 'col', ord: number, clientX: number, clientY: number) {
    const page = findPdfPageWrap(region.page);
    if (!page) return;
    const point = clientPointToLocalRatio(
      clientX,
      clientY,
      page.getBoundingClientRect(),
      { width: page.offsetWidth, height: page.offsetHeight },
      pageRotationDeg
    );
    const nextPos = clampGuidePos(
      draftRulesRef.current,
      axis,
      ord,
      axis === 'row' ? point.y : point.x
    );
    const next = draftRulesRef.current.map((rule) =>
      rule.axis === axis && rule.ord === ord ? { ...rule, pos: nextPos } : rule
    );
    draftRulesRef.current = next;
    setDraftRules(next);
  }

  function onGuidePointerDown(
    axis: 'row' | 'col',
    ord: number,
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!guidesEditable) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { axis, ord, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onGuidePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    moveGuide(drag.axis, drag.ord, event.clientX, event.clientY);
  }

  function onGuidePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    onRulesCommit?.({ rules: draftRulesRef.current.map((rule) => ({ ...rule })) });
  }

  function commitStructure(commit: TableOverlayStructureCommit) {
    draftRulesRef.current = commit.rules;
    setDraftRules(commit.rules);
    if (commit.cells) {
      draftCellsRef.current = commit.cells;
      setDraftCells(commit.cells);
    }
    if (commit.merges) {
      draftMergesRef.current = commit.merges.map((merge) => ({ ...merge }));
    }
    if (commit.rowRoles) {
      draftRowRolesRef.current = commit.rowRoles.map((entry) => ({ ...entry }));
    }
    onRulesCommit?.({
      rules: commit.rules.map((rule) => ({ ...rule })),
      ...(commit.cells ? { cells: commit.cells.map((cell) => ({ ...cell })) } : {}),
      ...(commit.merges ? { merges: commit.merges.map((merge) => ({ ...merge })) } : {}),
      ...(commit.rowRoles ? { rowRoles: commit.rowRoles.map((entry) => ({ ...entry })) } : {}),
    });
  }

  function splitAtClientPoint(
    clientX: number,
    clientY: number,
    cell: { x0: number; y0: number; x1: number; y1: number }
  ) {
    if (!guidesEditable) return;
    const page = findPdfPageWrap(region.page);
    if (!page) return;
    const point = clientPointToLocalRatio(
      clientX,
      clientY,
      page.getBoundingClientRect(),
      { width: page.offsetWidth, height: page.offsetHeight },
      pageRotationDeg
    );
    const choice = {
      ...tableStructureOf({
        ...table,
        rules: draftRulesRef.current,
        cells: draftCellsRef.current,
        merges: draftMergesRef.current,
        rowRoles: draftRowRolesRef.current,
      }),
      rules: draftRulesRef.current,
      cells: draftCellsRef.current,
      merges: draftMergesRef.current,
      rowRoles: draftRowRolesRef.current,
    };
    const midX = (cell.x0 + cell.x1) / 2;
    const midY = (cell.y0 + cell.y1) / 2;
    // Farther from the cell mid-line → that axis gets the new divider through the click.
    const primary: 'row' | 'col' =
      Math.abs(point.x - midX) >= Math.abs(point.y - midY) ? 'col' : 'row';
    const primaryPos = primary === 'row' ? point.y : point.x;
    const split =
      splitTableBandAtPos(table, choice, primary, primaryPos) ??
      splitTableBandAtPos(
        table,
        choice,
        primary === 'row' ? 'col' : 'row',
        primary === 'row' ? point.x : point.y
      );
    if (!split) return;
    commitStructure({
      rules: split.rules,
      cells: split.cells,
      merges: split.choice.merges,
      rowRoles: split.choice.rowRoles,
    });
  }

  if (!active || !host) return null;

  const width = Math.max(0.001, draftBounds.x1 - draftBounds.x0);
  const height = Math.max(0.001, draftBounds.y1 - draftBounds.y0);

  const node = (
    <div
      className="table-pdf-overlay"
      data-testid="table-pdf-overlay"
      data-region={region.id}
      data-rotation-deg={String(pageRotationDeg)}
      data-guides-editable={guidesEditable ? '1' : '0'}
    >
      <ResizableNormalizedRect
        rect={draftBounds}
        pageRotationDeg={pageRotationDeg}
        className="table-pdf-bounds-editor"
        boxClassName="table-pdf-overlay-box"
        testId="table-bounds"
        interactive
        onChange={setDraftBounds}
      >
        <div className="table-pdf-guide-layer">
          {rowRules.slice(1, -1).map((rule) => {
            const top = ((rule.pos - draftBounds.y0) / height) * 100;
            return (
              <button
                key={`r-${String(rule.ord)}`}
                type="button"
                className={`table-pdf-guide table-pdf-guide-row${guidesEditable ? ' table-pdf-guide--drag' : ''}`}
                style={{ top: `${String(top)}%` }}
                aria-label={t('tableLayouts.rowGuideAria', { n: rule.ord })}
                data-testid={`table-guide-row-${String(rule.ord)}`}
                disabled={!guidesEditable}
                onPointerDown={(event) => {
                  onGuidePointerDown('row', rule.ord, event);
                }}
                onPointerMove={onGuidePointerMove}
                onPointerUp={onGuidePointerUp}
                onPointerCancel={onGuidePointerUp}
              />
            );
          })}
          {colRules.slice(1, -1).map((rule) => {
            const left = ((rule.pos - draftBounds.x0) / width) * 100;
            return (
              <button
                key={`c-${String(rule.ord)}`}
                type="button"
                className={`table-pdf-guide table-pdf-guide-col${guidesEditable ? ' table-pdf-guide--drag' : ''}`}
                style={{ left: `${String(left)}%` }}
                aria-label={t('tableLayouts.colGuideAria', { n: rule.ord })}
                data-testid={`table-guide-col-${String(rule.ord)}`}
                disabled={!guidesEditable}
                onPointerDown={(event) => {
                  onGuidePointerDown('col', rule.ord, event);
                }}
                onPointerMove={onGuidePointerMove}
                onPointerUp={onGuidePointerUp}
                onPointerCancel={onGuidePointerUp}
              />
            );
          })}
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const y0 = rowRules[row]?.pos ?? draftBounds.y0;
              const y1 = rowRules[row + 1]?.pos ?? draftBounds.y1;
              const x0 = colRules[col]?.pos ?? draftBounds.x0;
              const x1 = colRules[col + 1]?.pos ?? draftBounds.x1;
              const selected =
                selectedCell !== null && selectedCell.row === row && selectedCell.col === col;
              return (
                <button
                  key={`${String(row)}-${String(col)}`}
                  type="button"
                  className={`table-pdf-cell${selected ? ' table-pdf-cell-selected' : ''}`}
                  style={{
                    left: `${String(((x0 - draftBounds.x0) / width) * 100)}%`,
                    top: `${String(((y0 - draftBounds.y0) / height) * 100)}%`,
                    width: `${String(((x1 - x0) / width) * 100)}%`,
                    height: `${String(((y1 - y0) / height) * 100)}%`,
                  }}
                  aria-label={t('tableLayouts.cellAria', { row: row + 1, col: col + 1 })}
                  title={guidesEditable ? t('tableLayouts.splitCellHint') : undefined}
                  onClick={() => {
                    onSelectCell(row, col);
                  }}
                  onDoubleClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectCell(row, col);
                    splitAtClientPoint(event.clientX, event.clientY, { x0, y0, x1, y1 });
                  }}
                />
              );
            })
          )}
        </div>
      </ResizableNormalizedRect>
      <div
        className="table-pdf-minibar"
        role="toolbar"
        aria-label={t('tableLayouts.miniBarAria')}
        data-testid="table-pdf-minibar"
      >
        <Button
          type="button"
          size="sm"
          variant="primary"
          data-testid="table-overlay-save-bounds"
          onClick={() => {
            onBoundsCommit(draftBounds);
          }}
        >
          {t('tableLayouts.saveBounds')}
        </Button>
        {onRedetect ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="table-overlay-redetect"
            onClick={onRedetect}
          >
            {t('tableLayouts.redetectGrid')}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid="table-overlay-close"
          onClick={onClose}
        >
          {t('tableLayouts.exitDocumentEdit')}
        </Button>
      </div>
      {guidesEditable ? (
        <p className="table-pdf-guide-hint">{t('tableLayouts.dragGuidesHint')}</p>
      ) : null}
    </div>
  );

  return createPortal(node, host);
}
