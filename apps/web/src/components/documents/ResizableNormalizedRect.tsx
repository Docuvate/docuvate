// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { NormalizedRect } from '@docuvate/contracts';
import { normalizeRect } from '@docuvate/contracts';
import type { ReactNode } from 'react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { clientPointToLocalRatio } from '../../lib/viewerGeometry';

export type RectHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: Exclude<RectHandle, 'move'>[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

function clampRect(rect: NormalizedRect): NormalizedRect {
  return (
    normalizeRect({
      x0: Math.min(0.999, Math.max(0, rect.x0)),
      y0: Math.min(0.999, Math.max(0, rect.y0)),
      x1: Math.min(1, Math.max(0.001, rect.x1)),
      y1: Math.min(1, Math.max(0.001, rect.y1)),
    }) ?? rect
  );
}

interface ResizableNormalizedRectProps {
  rect: NormalizedRect;
  pageRotationDeg: number;
  className?: string;
  boxClassName?: string;
  testId?: string;
  /** When false, only paints the box (e.g. mid-draw). */
  interactive?: boolean;
  children?: ReactNode;
  onChange: (rect: NormalizedRect) => void;
}

/** Absolute MediaBox box with optional 8-way resize + move handles. */
export function ResizableNormalizedRect({
  rect,
  pageRotationDeg,
  className = 'resizable-norm-rect',
  boxClassName = 'resizable-norm-rect-box',
  testId = 'resizable-norm-rect',
  interactive = true,
  children,
  onChange,
}: ResizableNormalizedRectProps) {
  const { t } = useTranslation();
  const drag = useRef<{
    handle: RectHandle;
    startX: number;
    startY: number;
    origin: NormalizedRect;
  } | null>(null);

  const onPointerDown = useCallback(
    (handle: RectHandle, event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (!interactive) return;
      event.preventDefault();
      event.stopPropagation();
      const host =
        event.currentTarget.closest('.pdf-page-wrap') ?? event.currentTarget.parentElement;
      if (!(host instanceof HTMLElement)) return;
      const point = clientPointToLocalRatio(
        event.clientX,
        event.clientY,
        host.getBoundingClientRect(),
        { width: host.offsetWidth, height: host.offsetHeight },
        pageRotationDeg
      );
      drag.current = {
        handle,
        startX: point.x,
        startY: point.y,
        origin: rect,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [interactive, pageRotationDeg, rect]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      if (!state) return;
      const host = event.currentTarget.closest('.pdf-page-wrap') ?? event.currentTarget;
      if (!(host instanceof HTMLElement)) return;
      const point = clientPointToLocalRatio(
        event.clientX,
        event.clientY,
        host.getBoundingClientRect(),
        { width: host.offsetWidth, height: host.offsetHeight },
        pageRotationDeg
      );
      const dx = point.x - state.startX;
      const dy = point.y - state.startY;
      const o = state.origin;
      let next = { ...o };
      if (state.handle === 'move') {
        const w = o.x1 - o.x0;
        const h = o.y1 - o.y0;
        next = { x0: o.x0 + dx, y0: o.y0 + dy, x1: o.x0 + dx + w, y1: o.y0 + dy + h };
      } else {
        if (state.handle.includes('n')) next.y0 = o.y0 + dy;
        if (state.handle.includes('s')) next.y1 = o.y1 + dy;
        if (state.handle.includes('w')) next.x0 = o.x0 + dx;
        if (state.handle.includes('e')) next.x1 = o.x1 + dx;
      }
      onChange(clampRect(next));
    },
    [onChange, pageRotationDeg]
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const style = {
    left: `${String(rect.x0 * 100)}%`,
    top: `${String(rect.y0 * 100)}%`,
    width: `${String((rect.x1 - rect.x0) * 100)}%`,
    height: `${String((rect.y1 - rect.y0) * 100)}%`,
  };

  return (
    <div
      className={className}
      data-testid={testId}
      data-interactive={interactive ? '1' : '0'}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={boxClassName}
        style={style}
        data-testid={`${testId}-box`}
        onPointerDown={(event) => {
          onPointerDown('move', event);
        }}
        role="presentation"
      >
        {children}
        {interactive
          ? HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                className={`field-bbox-handle field-bbox-handle--${handle}`}
                data-testid={
                  handle === 'se' && testId === 'table-bounds'
                    ? 'table-bounds-handle'
                    : `${testId}-handle-${handle}`
                }
                aria-label={t('documents.fieldBboxHandle', { handle })}
                onPointerDown={(event) => {
                  onPointerDown(handle, event);
                }}
              />
            ))
          : null}
      </div>
    </div>
  );
}
