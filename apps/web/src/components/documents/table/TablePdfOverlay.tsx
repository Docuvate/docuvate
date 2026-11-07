// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, DocumentRegionTableDto, NormalizedRect } from '@docuvate/contracts';
import { normalizeRect } from '@docuvate/contracts';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { clientPointToLocalRatio, findPdfPageWrap } from '../../../lib/viewerGeometry';
import { Button } from '../../ui/Button';

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
  onClose: () => void;
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
  onClose,
}: TablePdfOverlayProps) {
  const { t } = useTranslation();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [draftBounds, setDraftBounds] = useState<NormalizedRect>({
    x0: region.x0,
    y0: region.y0,
    x1: region.x1,
    y1: region.y1,
  });

  useEffect(() => {
    setDraftBounds({ x0: region.x0, y0: region.y0, x1: region.x1, y1: region.y1 });
  }, [region.x0, region.y0, region.x1, region.y1, region.id]);

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

  const rowRules = useMemo(
    () => table.rules.filter((rule) => rule.axis === 'row').sort((a, b) => a.ord - b.ord),
    [table.rules]
  );
  const colRules = useMemo(
    () => table.rules.filter((rule) => rule.axis === 'col').sort((a, b) => a.ord - b.ord),
    [table.rules]
  );
  const rows = Math.max(0, rowRules.length - 1);
  const cols = Math.max(0, colRules.length - 1);

  if (!active || !host) return null;

  const width = Math.max(0.001, draftBounds.x1 - draftBounds.x0);
  const height = Math.max(0.001, draftBounds.y1 - draftBounds.y0);
  const boxStyle = {
    left: `${String(draftBounds.x0 * 100)}%`,
    top: `${String(draftBounds.y0 * 100)}%`,
    width: `${String(width * 100)}%`,
    height: `${String(height * 100)}%`,
  };

  const node = (
    <div
      className="table-pdf-overlay"
      data-testid="table-pdf-overlay"
      data-region={region.id}
      data-rotation-deg={String(pageRotationDeg)}
    >
      <div className="table-pdf-overlay-box" style={boxStyle}>
        {rowRules.slice(1, -1).map((rule) => {
          const top = ((rule.pos - draftBounds.y0) / height) * 100;
          return (
            <div
              key={`r-${String(rule.ord)}`}
              className="table-pdf-guide table-pdf-guide-row"
              style={{ top: `${String(top)}%` }}
            />
          );
        })}
        {colRules.slice(1, -1).map((rule) => {
          const left = ((rule.pos - draftBounds.x0) / width) * 100;
          return (
            <div
              key={`c-${String(rule.ord)}`}
              className="table-pdf-guide table-pdf-guide-col"
              style={{ left: `${String(left)}%` }}
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
                onClick={() => {
                  onSelectCell(row, col);
                }}
              />
            );
          })
        )}
        <button
          type="button"
          className="table-pdf-bounds-handle"
          aria-label={t('tableLayouts.resizeBounds')}
          data-testid="table-bounds-handle"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const wrap = event.currentTarget.closest('.pdf-page-wrap');
            if (!(wrap instanceof HTMLElement)) return;
            const origin = draftBounds;
            const onMove = (moveEvent: PointerEvent) => {
              const point = clientPointToLocalRatio(
                moveEvent.clientX,
                moveEvent.clientY,
                wrap.getBoundingClientRect(),
                { width: wrap.offsetWidth, height: wrap.offsetHeight },
                pageRotationDeg
              );
              const x = point.x;
              const y = point.y;
              setDraftBounds(
                normalizeRect({
                  x0: origin.x0,
                  y0: origin.y0,
                  x1: Math.min(1, Math.max(origin.x0 + 0.02, x)),
                  y1: Math.min(1, Math.max(origin.y0 + 0.02, y)),
                }) ?? origin
              );
            };
            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        />
      </div>
      <div className="table-pdf-overlay-actions">
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
    </div>
  );

  return createPortal(node, host);
}
