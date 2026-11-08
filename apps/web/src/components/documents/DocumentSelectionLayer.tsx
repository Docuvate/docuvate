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
import { useCallback, useEffect, useRef } from 'react';

import {
  clientPointToLocalRatio,
  clientRectToLocalRatio,
  findPdfPageWrap,
  readDatasetRotation,
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

function wrapUnderPoint(clientX: number, clientY: number, page: number): HTMLElement | null {
  if (typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  for (const hit of document.elementsFromPoint(clientX, clientY)) {
    const wrap = pageWrapForEvent(hit);
    if (wrap != null && (wrap.dataset.page == null || wrap.dataset.page === String(page))) {
      return wrap;
    }
  }
  return null;
}

function pageWrapForPage(page: number, remembered: HTMLElement | null): HTMLElement | null {
  const wraps = [...document.querySelectorAll('.pdf-page-wrap')].filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );
  const wanted = String(page);
  const matched = wraps.find((wrap) => wrap.dataset.page === wanted);
  if (matched != null) {
    return matched;
  }
  if (
    remembered != null &&
    remembered.isConnected &&
    wraps.includes(remembered) &&
    (remembered.dataset.page == null || remembered.dataset.page === wanted)
  ) {
    return remembered;
  }
  return wraps[0] ?? null;
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

function paintMark(wrap: HTMLElement, rect: NormalizedRect): void {
  const existing = wrap.querySelector('[data-testid="document-selection-rect"]');
  const mark = existing instanceof HTMLElement ? existing : document.createElement('div');
  if (!(existing instanceof HTMLElement)) {
    mark.className = 'document-selection-live-box';
    mark.setAttribute('data-testid', 'document-selection-rect');
    wrap.appendChild(mark);
  }
  mark.style.left = `${String(rect.x0 * 100)}%`;
  mark.style.top = `${String(rect.y0 * 100)}%`;
  mark.style.width = `${String((rect.x1 - rect.x0) * 100)}%`;
  mark.style.height = `${String((rect.y1 - rect.y0) * 100)}%`;
}

function clearMark(): void {
  document.querySelector('[data-testid="document-selection-rect"]')?.remove();
}

function scrollableAncestor(node: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = node.parentElement;
  let found: HTMLElement | null = null;
  while (current) {
    const overflow = getComputedStyle(current).overflowY;
    if (
      (overflow === 'auto' || overflow === 'scroll') &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      found = current;
    }
    current = current.parentElement;
  }
  return found;
}

/**
 * The page can sit above the visible scroller after a side panel scrolls the
 * document. A drag at the top of that page then misses it. Bring the top back
 * only when it is outside the scroller; a page already in view stays put.
 */
function revealPageWrap(page: number): boolean {
  const wrap = pageWrapForPage(page, null);
  if (!wrap) {
    return false;
  }
  const scroller = scrollableAncestor(wrap);
  if (!scroller) {
    return true;
  }
  const bounds = wrap.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  const topInView = bounds.top >= view.top && bounds.top < view.bottom;
  if (topInView) {
    return true;
  }
  wrap.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
  return true;
}

export function DocumentSelectionLayer({
  tool,
  page,
  tokens,
  onDraftChange,
}: DocumentSelectionLayerProps) {
  const drawnRectRef = useRef<NormalizedRect | null>(null);
  const drawWrapRef = useRef<HTMLElement | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const activeWrapRef = useRef<HTMLElement | null>(null);
  const revealedRef = useRef(false);

  const commitViewerRect = useCallback(
    (next: NormalizedRect | null, wrap: HTMLElement | null) => {
      if (!next || !wrap) {
        drawnRectRef.current = null;
        clearMark();
        onDraftChange(null);
        return;
      }
      drawnRectRef.current = next;
      paintMark(wrap, next);
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
      originRef.current = null;
      activeWrapRef.current = null;
      drawnRectRef.current = null;
      revealedRef.current = false;
      clearMark();
      return;
    }
    revealedRef.current = revealPageWrap(page);
    function wrapForGesture(event: MouseEvent): HTMLElement | null {
      const fromTarget = pageWrapForEvent(event.target);
      if (fromTarget != null) {
        if (fromTarget.dataset.page != null && fromTarget.dataset.page !== String(page)) {
          return null;
        }
        return fromTarget;
      }
      // A toolbar click is not a page drag. Only a pointer that actually
      // lands on this page may start or continue the gesture.
      return wrapUnderPoint(event.clientX, event.clientY, page);
    }
    function onPointerDown(event: MouseEvent) {
      // Pointer and compatibility mouse events both arrive for one press.
      // A second down must not collapse the rectangle back to a point.
      if (originRef.current) {
        return;
      }
      const wrap = wrapForGesture(event);
      if (!wrap) {
        return;
      }
      event.preventDefault();
      const start = clientToNormalized(wrap, event.clientX, event.clientY);
      const rect = { x0: start.x, y0: start.y, x1: start.x, y1: start.y };
      originRef.current = start;
      activeWrapRef.current = wrap;
      drawWrapRef.current = wrap;
      commitViewerRect(rect, wrap);
    }
    function onPointerMove(event: MouseEvent) {
      const origin = originRef.current;
      const activeWrap = activeWrapRef.current;
      if (!origin || !activeWrap) {
        return;
      }
      const current = clientToNormalized(activeWrap, event.clientX, event.clientY);
      const rect = {
        x0: Math.min(origin.x, current.x),
        y0: Math.min(origin.y, current.y),
        x1: Math.max(origin.x, current.x),
        y1: Math.max(origin.y, current.y),
      };
      const wrap = activeWrap.isConnected ? activeWrap : wrapForGesture(event);
      if (!wrap) {
        return;
      }
      activeWrapRef.current = wrap;
      drawWrapRef.current = wrap;
      commitViewerRect(rect, wrap);
    }
    function onPointerUp() {
      originRef.current = null;
      activeWrapRef.current = null;
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
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

  useEffect(() => {
    if (tool !== 'rect') {
      return;
    }
    // A page render replaces the wrap and drops the rectangle with it.
    // Put the same rectangle on the new wrap. Style updates are not observed.
    const restore = () => {
      if (!revealedRef.current) {
        revealedRef.current = revealPageWrap(page);
      }
      const rect = drawnRectRef.current;
      if (!rect) {
        return;
      }
      const existing = document.querySelector('[data-testid="document-selection-rect"]');
      if (existing?.isConnected) {
        return;
      }
      const wrap = pageWrapForPage(page, drawWrapRef.current);
      if (!wrap) {
        return;
      }
      drawWrapRef.current = wrap;
      paintMark(wrap, rect);
    };
    const observer = new MutationObserver(restore);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [page, tool]);

  return (
    <span
      hidden
      data-testid="document-selection-layer"
      data-token-count={String(tokens.length)}
      data-page={String(page)}
    />
  );
}
