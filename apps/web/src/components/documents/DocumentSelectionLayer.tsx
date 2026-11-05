// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken, NormalizedRect } from '@docuvate/contracts';
import {
  joinedTokenText,
  selectionRectForTokenSpace,
  snapRectToTokenHull,
  tokensInsideRect,
} from '@docuvate/contracts';
import { useCallback, useEffect, useState } from 'react';

import type { DocumentSelectionTool } from './DocumentSelectionTools';

export interface DocumentSelectionDraft {
  page: number;
  rect: NormalizedRect;
  tokens: LayoutToken[];
  text: string;
}

interface DocumentSelectionLayerProps {
  tool: DocumentSelectionTool;
  page: number;
  tokens: LayoutToken[];
  onDraftChange: (draft: DocumentSelectionDraft | null) => void;
}

function pageWrapForEvent(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const wrap = target.closest('.pdf-page-wrap');
  return wrap instanceof HTMLElement ? wrap : null;
}

function pageWrapForPage(page: number): HTMLElement | null {
  const wraps = document.querySelectorAll('.pdf-page-wrap');
  for (const node of wraps) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.dataset.page === String(page)) {
      return node;
    }
  }
  const first = wraps.item(0);
  return first instanceof HTMLElement ? first : null;
}

function readPageRotationDeg(wrap: HTMLElement): number {
  const raw = wrap.dataset.pdfRotate;
  if (raw == null || raw === '') {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * IR tokens from pdfplumber already match the PDF.js viewport after /Rotate.
 * Tokens stored against the unrotated MediaBox set data-tokens-unrotated="1".
 */
function tokensUseUnrotatedMediaBox(wrap: HTMLElement): boolean {
  return wrap.dataset.tokensUnrotated === '1';
}

function clientToNormalized(
  wrap: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const bounds = wrap.getBoundingClientRect();
  const width = bounds.width || 1;
  const height = bounds.height || 1;
  return {
    x: Math.min(1, Math.max(0, (clientX - bounds.left) / width)),
    y: Math.min(1, Math.max(0, (clientY - bounds.top) / height)),
  };
}

function draftFromViewerRect(
  page: number,
  tokens: LayoutToken[],
  viewerRect: NormalizedRect,
  pageRotationDeg: number,
  unrotatedMediaBox: boolean
): DocumentSelectionDraft {
  const mapped =
    selectionRectForTokenSpace(viewerRect, pageRotationDeg, unrotatedMediaBox) ?? viewerRect;
  const selected = tokensInsideRect(
    tokens.filter((token) => token.page === page),
    mapped
  );
  return {
    page,
    rect: snapRectToTokenHull(selected) ?? mapped,
    tokens: selected,
    text: joinedTokenText(selected),
  };
}

export function DocumentSelectionLayer({
  tool,
  page,
  tokens,
  onDraftChange,
}: DocumentSelectionLayerProps) {
  const [liveRect, setLiveRect] = useState<NormalizedRect | null>(null);

  const commitViewerRect = useCallback(
    (next: NormalizedRect | null, wrap: HTMLElement | null) => {
      setLiveRect(next);
      if (!next || !wrap) {
        onDraftChange(null);
        return;
      }
      onDraftChange(
        draftFromViewerRect(
          page,
          tokens,
          next,
          readPageRotationDeg(wrap),
          tokensUseUnrotatedMediaBox(wrap)
        )
      );
    },
    [onDraftChange, page, tokens]
  );

  useEffect(() => {
    if (tool !== 'rect') {
      setLiveRect(null);
      return;
    }
    let origin: { x: number; y: number } | null = null;
    let activeWrap: HTMLElement | null = null;
    function onPointerDown(event: PointerEvent) {
      const wrap = pageWrapForEvent(event.target);
      if (!wrap) {
        return;
      }
      if (wrap.dataset.page != null && wrap.dataset.page !== String(page)) {
        return;
      }
      event.preventDefault();
      const start = clientToNormalized(wrap, event.clientX, event.clientY);
      origin = start;
      activeWrap = wrap;
      commitViewerRect({ x0: start.x, y0: start.y, x1: start.x, y1: start.y }, wrap);
    }
    function onPointerMove(event: PointerEvent) {
      if (!origin || !activeWrap) {
        return;
      }
      const current = clientToNormalized(activeWrap, event.clientX, event.clientY);
      commitViewerRect(
        {
          x0: Math.min(origin.x, current.x),
          y0: Math.min(origin.y, current.y),
          x1: Math.max(origin.x, current.x),
          y1: Math.max(origin.y, current.y),
        },
        activeWrap
      );
    }
    function onPointerUp() {
      origin = null;
      activeWrap = null;
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [commitViewerRect, page, tool]);

  useEffect(() => {
    if (tool !== 'text') {
      return;
    }
    function onSelectionChange() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }
      const range = selection.getRangeAt(0);
      const wrap = pageWrapForEvent(range.commonAncestorContainer) ?? pageWrapForPage(page);
      if (!wrap) {
        return;
      }
      const bounds = wrap.getBoundingClientRect();
      const client = range.getBoundingClientRect();
      if (client.width <= 0 || client.height <= 0) {
        return;
      }
      const viewerRect: NormalizedRect = {
        x0: Math.min(1, Math.max(0, (client.left - bounds.left) / (bounds.width || 1))),
        y0: Math.min(1, Math.max(0, (client.top - bounds.top) / (bounds.height || 1))),
        x1: Math.min(1, Math.max(0, (client.right - bounds.left) / (bounds.width || 1))),
        y1: Math.min(1, Math.max(0, (client.bottom - bounds.top) / (bounds.height || 1))),
      };
      onDraftChange(
        draftFromViewerRect(
          page,
          tokens,
          viewerRect,
          readPageRotationDeg(wrap),
          tokensUseUnrotatedMediaBox(wrap)
        )
      );
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [onDraftChange, page, tokens, tool]);

  useEffect(() => {
    const wrap = pageWrapForPage(page);
    if (!(wrap instanceof HTMLElement) || !liveRect || tool !== 'rect') {
      const stale = document.querySelector('[data-testid="document-selection-rect"]');
      stale?.remove();
      return;
    }
    const existing = wrap.querySelector('[data-testid="document-selection-rect"]');
    const mark = existing instanceof HTMLElement ? existing : document.createElement('div');
    if (!(existing instanceof HTMLElement)) {
      mark.className = 'document-selection-live-box';
      mark.setAttribute('data-testid', 'document-selection-rect');
      wrap.appendChild(mark);
    }
    mark.style.left = `${String(liveRect.x0 * 100)}%`;
    mark.style.top = `${String(liveRect.y0 * 100)}%`;
    mark.style.width = `${String((liveRect.x1 - liveRect.x0) * 100)}%`;
    mark.style.height = `${String((liveRect.y1 - liveRect.y0) * 100)}%`;
    return () => {
      mark.remove();
    };
  }, [liveRect, page, tool]);

  return (
    <span
      hidden
      data-testid="document-selection-layer"
      data-token-count={String(tokens.length)}
      data-page={String(page)}
    />
  );
}
