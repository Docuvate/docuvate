// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken, NormalizedRect } from '@docuvate/contracts';
import {
  joinedTokenText,
  normalizeRect,
  padTextSelectionRect,
  selectionRectForTokenSpace,
  snapRectToTokenHull,
  tokensInsideRect,
  tokensMatchingSelectedText,
} from '@docuvate/contracts';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  clientPointToLocalRatio,
  clientRectToLocalRatio,
  findPdfPageWrap,
  readDatasetRotation,
  selectionPaintWrapIndex,
} from '../../lib/viewerGeometry';
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
  let node: Node | null = null;
  if (target instanceof Node) {
    node = target;
  }
  while (node != null) {
    if (node instanceof HTMLElement && node.classList.contains('pdf-page-wrap')) {
      return node;
    }
    if (node instanceof Element) {
      const wrap = node.closest('.pdf-page-wrap');
      if (wrap instanceof HTMLElement) {
        return wrap;
      }
      return null;
    }
    node = node.parentNode;
  }
  return null;
}

function pageWraps(): HTMLElement[] {
  return [...document.querySelectorAll('.pdf-page-wrap')].filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
}

function wrapNamesPage(wrap: HTMLElement, page: number): boolean {
  return wrap.dataset.page == null || wrap.dataset.page === String(page);
}

function pageWrapAtPoint(clientX: number, clientY: number, page: number): HTMLElement | null {
  if (typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  for (const hit of document.elementsFromPoint(clientX, clientY)) {
    const wrap = pageWrapForEvent(hit);
    if (wrap != null && wrapNamesPage(wrap, page)) {
      return wrap;
    }
  }
  return null;
}

function paintWrap(page: number, remembered: HTMLElement | null): HTMLElement | null {
  const wraps = pageWraps();
  const rememberedIndex = remembered == null ? -1 : wraps.indexOf(remembered);
  const index = selectionPaintWrapIndex(
    wraps.map((wrap) => wrap.dataset.page ?? null),
    page,
    rememberedIndex >= 0 ? rememberedIndex : null,
    remembered?.isConnected === true
  );
  if (index == null) {
    return null;
  }
  return wraps[index] ?? null;
}

function readPageRotationDeg(wrap: HTMLElement): number {
  return readDatasetRotation(wrap.dataset.pdfRotate);
}

function readDisplayRotationDeg(wrap: HTMLElement): number {
  return readDatasetRotation(wrap.dataset.displayRotation);
}

function localBox(wrap: HTMLElement): { width: number; height: number } {
  return { width: wrap.offsetWidth, height: wrap.offsetHeight };
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
  return clientPointToLocalRatio(
    clientX,
    clientY,
    wrap.getBoundingClientRect(),
    localBox(wrap),
    readDisplayRotationDeg(wrap)
  );
}

function clientRectToNormalized(wrap: HTMLElement, client: DOMRect): NormalizedRect | null {
  const mapped = clientRectToLocalRatio(
    client,
    wrap.getBoundingClientRect(),
    localBox(wrap),
    readDisplayRotationDeg(wrap)
  );
  return normalizeRect(mapped);
}

function unionClientRects(wrap: HTMLElement, rects: DOMRectList): NormalizedRect | null {
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  let any = false;
  for (let i = 0; i < rects.length; i += 1) {
    const client = rects.item(i);
    if (client == null || client.width <= 0 || client.height <= 0) {
      continue;
    }
    const part = clientRectToNormalized(wrap, client);
    if (part == null) {
      continue;
    }
    any = true;
    x0 = Math.min(x0, part.x0);
    y0 = Math.min(y0, part.y0);
    x1 = Math.max(x1, part.x1);
    y1 = Math.max(y1, part.y1);
  }
  if (!any) {
    return null;
  }
  return normalizeRect({ x0, y0, x1, y1 });
}

function draftFromViewerRect(
  page: number,
  tokens: LayoutToken[],
  viewerRect: NormalizedRect,
  pageRotationDeg: number,
  unrotatedMediaBox: boolean,
  selectedText?: string
): DocumentSelectionDraft {
  const mapped =
    selectionRectForTokenSpace(viewerRect, pageRotationDeg, unrotatedMediaBox) ?? viewerRect;
  const pageTokens = tokens.filter((token) => token.page === page);
  // Slightly inflate DOM text boxes — PDF.js glyph AABBs are tighter than IR words —
  // but never by more than half the box per axis, or a one-line pick swallows its neighbours.
  const padded = selectedText != null ? padTextSelectionRect(mapped, 0.03) : mapped;
  let selected = tokensInsideRect(pageTokens, padded);
  // PDF.js textLayer boxes often diverge from pdfplumber IR on /Rotate pages;
  // fall back to matching the selected string against IR word tokens.
  if (selected.length === 0 && selectedText != null && selectedText.trim().length > 0) {
    selected = tokensMatchingSelectedText(pageTokens, selectedText, mapped);
  }
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
  const drawWrapRef = useRef<HTMLElement | null>(null);

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

  useLayoutEffect(() => {
    if (tool !== 'rect') {
      setLiveRect(null);
      return;
    }
    let origin: { x: number; y: number } | null = null;
    let activeWrap: HTMLElement | null = null;
    function onPointerDown(event: PointerEvent) {
      const fromTarget = pageWrapForEvent(event.target);
      const wrap =
        (fromTarget != null && wrapNamesPage(fromTarget, page) ? fromTarget : null) ??
        pageWrapAtPoint(event.clientX, event.clientY, page);
      if (!wrap) {
        return;
      }
      event.preventDefault();
      const start = clientToNormalized(wrap, event.clientX, event.clientY);
      origin = start;
      activeWrap = wrap;
      drawWrapRef.current = wrap;
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
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', onPointerUp, true);
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
      const wrap = pageWrapForEvent(range.commonAncestorContainer) ?? findPdfPageWrap(page);
      if (!wrap) {
        return;
      }
      const fromRects = unionClientRects(wrap, range.getClientRects());
      const client = range.getBoundingClientRect();
      const fromBounds =
        client.width > 0 && client.height > 0 ? clientRectToNormalized(wrap, client) : null;
      const viewerRect = fromRects ?? fromBounds;
      if (viewerRect == null) {
        return;
      }
      onDraftChange(
        draftFromViewerRect(
          page,
          tokens,
          viewerRect,
          readPageRotationDeg(wrap),
          tokensUseUnrotatedMediaBox(wrap),
          selection.toString()
        )
      );
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [onDraftChange, page, tokens, tool]);

  useLayoutEffect(() => {
    if (!liveRect || tool !== 'rect') {
      drawWrapRef.current = null;
      document.querySelector('[data-testid="document-selection-rect"]')?.remove();
      return;
    }
    let mark: HTMLElement | null = null;
    const paint = () => {
      const wrap = paintWrap(page, drawWrapRef.current);
      if (!wrap) {
        mark?.remove();
        mark = null;
        return;
      }
      drawWrapRef.current = wrap;
      if (mark == null || !wrap.contains(mark)) {
        mark?.remove();
        mark = document.createElement('div');
        mark.className = 'document-selection-live-box';
        mark.setAttribute('data-testid', 'document-selection-rect');
        wrap.appendChild(mark);
      }
      mark.style.left = `${String(liveRect.x0 * 100)}%`;
      mark.style.top = `${String(liveRect.y0 * 100)}%`;
      mark.style.width = `${String((liveRect.x1 - liveRect.x0) * 100)}%`;
      mark.style.height = `${String((liveRect.y1 - liveRect.y0) * 100)}%`;
    };
    paint();
    const observer = new MutationObserver(() => {
      paint();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mark?.remove();
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
