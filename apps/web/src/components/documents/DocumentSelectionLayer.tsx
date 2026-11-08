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
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

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

function pageWrapForPage(page: number): HTMLElement | null {
  const wraps = document.querySelectorAll('.pdf-page-wrap');
  for (const candidate of wraps) {
    if (!(candidate instanceof HTMLElement)) {
      continue;
    }
    if (candidate.dataset.page === String(page)) {
      return candidate;
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

function clientRectToNormalized(wrap: HTMLElement, client: DOMRect): NormalizedRect | null {
  const bounds = wrap.getBoundingClientRect();
  const width = bounds.width || 1;
  const height = bounds.height || 1;
  return normalizeRect({
    x0: (client.left - bounds.left) / width,
    y0: (client.top - bounds.top) / height,
    x1: (client.right - bounds.left) / width,
    y1: (client.bottom - bounds.top) / height,
  });
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
      document.querySelector('[data-testid="document-selection-rect"]')?.remove();
      return;
    }
    let mark: HTMLElement | null = null;
    const paint = () => {
      const wrap = pageWrapForPage(page);
      if (!(wrap instanceof HTMLElement)) {
        mark?.remove();
        mark = null;
        return;
      }
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
