// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { NormalizedRect } from '@docuvate/contracts';
import { normalizeRect } from '@docuvate/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';

type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface FieldBoundingBoxEditorProps {
  page: number;
  rect: NormalizedRect;
  active: boolean;
  pageRotationDeg: number;
  onCommit: (rect: NormalizedRect) => void;
  onCancel: () => void;
}

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

/**
 * Interactive field evidence box on the current PDF page. Coordinates are stored in
 * unrotated MediaBox space; the overlay is drawn in the oriented viewer.
 */
export function FieldBoundingBoxEditor({
  page,
  rect,
  active,
  pageRotationDeg,
  onCommit,
  onCancel,
}: FieldBoundingBoxEditorProps) {
  const { t } = useTranslation();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(rect);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; origin: NormalizedRect } | null>(
    null
  );

  useEffect(() => {
    setDraft(rect);
    // Intentionally key off rect edges + page, not object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same geometry must not reset an in-progress drag
  }, [rect.x0, rect.y0, rect.x1, rect.y1, page]);

  useEffect(() => {
    if (!active) {
      setHost(null);
      return;
    }
    const sync = () => {
      const wraps = document.querySelectorAll('.pdf-page-wrap');
      for (const node of wraps) {
        if (node instanceof HTMLElement) {
          setHost(node);
          return;
        }
      }
      setHost(null);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [active, page, pageRotationDeg]);

  const onPointerDown = useCallback(
    (handle: Handle, event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (!active) return;
      event.preventDefault();
      event.stopPropagation();
      const host = event.currentTarget.closest('.pdf-page-wrap') ?? event.currentTarget.parentElement;
      if (!(host instanceof HTMLElement)) return;
      const bounds = host.getBoundingClientRect();
      drag.current = {
        handle,
        startX: (event.clientX - bounds.left) / Math.max(1, bounds.width),
        startY: (event.clientY - bounds.top) / Math.max(1, bounds.height),
        origin: draft,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [active, draft]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      if (!state) return;
      const host = event.currentTarget.closest('.pdf-page-wrap') ?? event.currentTarget;
      if (!(host instanceof HTMLElement)) return;
      const bounds = host.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(1, bounds.width);
      const y = (event.clientY - bounds.top) / Math.max(1, bounds.height);
      const dx = x - state.startX;
      const dy = y - state.startY;
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
      setDraft(clampRect(next));
    },
    []
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  if (!active || !host) return null;

  const style = {
    left: `${String(draft.x0 * 100)}%`,
    top: `${String(draft.y0 * 100)}%`,
    width: `${String((draft.x1 - draft.x0) * 100)}%`,
    height: `${String((draft.y1 - draft.y0) * 100)}%`,
  };

  const handles: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return createPortal(
    <div
      className="field-bbox-editor"
      data-testid="field-bbox-editor"
      data-page={String(page)}
      data-rotation-deg={String(pageRotationDeg)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="field-bbox-box"
        style={style}
        onPointerDown={(event) => {
          onPointerDown('move', event);
        }}
        role="presentation"
      >
        {handles.map((handle) => (
          <button
            key={handle}
            type="button"
            className={`field-bbox-handle field-bbox-handle--${handle}`}
            aria-label={t('documents.fieldBboxHandle', { handle })}
            onPointerDown={(event) => {
              onPointerDown(handle, event);
            }}
          />
        ))}
      </div>
      <div className="field-bbox-actions">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="field-bbox-save"
          onClick={() => {
            onCommit(clampRect(draft));
          }}
        >
          {t('documents.fieldBboxSave')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  , host);
}