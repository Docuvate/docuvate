// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import * as pdfjs from 'pdfjs-dist';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatUserFacingError } from '../../lib/apiErrors';
import { computeVirtualPageWindow, layoutOverlayPercentStyles } from '../../lib/pdfViewerVirtual';
import { Button } from '../ui/Button';

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

interface PdfHighlightBlock {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfLayoutOverlay {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: 'heading' | 'field' | 'table' | 'text';
  label: string;
  value?: string;
}

const NO_HIGHLIGHTS: PdfHighlightBlock[] = [];
const NO_LAYOUT_OVERLAYS: PdfLayoutOverlay[] = [];

interface PdfViewerProps {
  url?: string;
  data?: ArrayBuffer;
  highlightBlocks?: PdfHighlightBlock[];
  /** Single-page mode with pager (default true). */
  paginated?: boolean;
  /** Scale pages to fit the scroll container width (embedded compare panes). */
  fitWidth?: boolean;
  /** 1-based page; controlled when onPageChange is set. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Normalized click position on a page (0–1), for text crosslink. */
  onPageClick?: (page: number, nx: number, ny: number) => void;
  layoutOverlays?: PdfLayoutOverlay[];
  layoutOverlayEnabled?: boolean;
  activeLayoutOverlayId?: string | null;
  onLayoutOverlaySelect?: (id: string) => void;
  onLayoutOverlayHover?: (overlay: PdfLayoutOverlay | null) => void;
  onLayoutOverlayClear?: () => void;
}

const DEFAULT_PAGE_SCALE = 1.25;
const PDF_PAGES_HORIZONTAL_PADDING_PX = 48;
/** Ignore sub-pixel / scrollbar gutter width oscillation when fitWidth re-renders. */
const CONTAINER_WIDTH_STABLE_DELTA_PX = 8;

type PdfTextContent = Awaited<ReturnType<pdfjs.PDFPageProxy['getTextContent']>>;

function appendTextLayer(
  textContent: PdfTextContent,
  viewport: pdfjs.PageViewport,
  container: HTMLDivElement
) {
  for (const item of textContent.items) {
    if (!('str' in item) || !item.str) continue;
    const span = document.createElement('span');
    span.textContent = item.str;
    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
    const angle = Math.atan2(tx[1], tx[0]);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    span.style.left = `${String(tx[4])}px`;
    span.style.top = `${String(tx[5] - fontHeight)}px`;
    span.style.fontSize = `${String(fontHeight)}px`;
    span.style.transform = `rotate(${String(angle)}rad)`;
    container.appendChild(span);
  }
}

function bindPageClick(
  wrap: HTMLDivElement,
  pageNum: number,
  onPageClick: ((page: number, nx: number, ny: number) => void) | undefined
) {
  if (!onPageClick) return;
  wrap.classList.add('pdf-page-wrap-interactive');
  wrap.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.pdf-viewer-pager, .pdf-viewer-toolbar, button, a')) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    onPageClick(pageNum, nx, ny);
  });
}

function appendLayoutOverlays(
  wrap: HTMLDivElement,
  pageNum: number,
  overlays: PdfLayoutOverlay[],
  enabled: boolean,
  activeId: string | null | undefined,
  onSelect: ((id: string) => void) | undefined,
  onHover: ((overlay: PdfLayoutOverlay | null) => void) | undefined
) {
  if (!enabled) return;
  const pageOverlays = overlays.filter((o) => o.page === pageNum);
  for (const overlay of pageOverlays) {
    const mark = document.createElement('button');
    mark.type = 'button';
    mark.className = `pdf-layout-overlay pdf-layout-overlay-${overlay.kind}${
      overlay.id === activeId ? ' pdf-layout-overlay-active' : ''
    }`;
    mark.dataset.overlayId = overlay.id;
    if (overlay.label) mark.setAttribute('aria-label', overlay.label);
    const box = layoutOverlayPercentStyles(overlay);
    mark.style.left = box.left;
    mark.style.top = box.top;
    mark.style.width = box.width;
    mark.style.height = box.height;
    mark.tabIndex = 0;
    if (onSelect) {
      mark.addEventListener('click', (event) => {
        event.stopPropagation();
        onSelect(overlay.id);
      });
    }
    if (onHover) {
      mark.addEventListener('mouseenter', () => { onHover(overlay); });
      mark.addEventListener('mouseleave', () => { onHover(null); });
      mark.addEventListener('focus', () => { onHover(overlay); });
      mark.addEventListener('blur', () => { onHover(null); });
    }
    wrap.appendChild(mark);
  }
}

async function renderPdfPage(
  page: pdfjs.PDFPageProxy,
  pageNum: number,
  highlightBlocks: PdfHighlightBlock[],
  layoutOverlays: PdfLayoutOverlay[],
  layoutOverlayEnabled: boolean,
  activeLayoutOverlayId: string | null | undefined,
  scale: number,
  onPageClick?: (page: number, nx: number, ny: number) => void,
  onLayoutOverlaySelect?: (id: string) => void,
  onLayoutOverlayHover?: (overlay: PdfLayoutOverlay | null) => void
): Promise<HTMLDivElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.className = 'pdf-page-canvas';

  await page.render({ canvasContext: ctx, viewport }).promise;

  const wrap = document.createElement('div');
  wrap.className = 'pdf-page-wrap';
  wrap.dataset.page = String(pageNum);
  wrap.style.width = `${String(viewport.width)}px`;
  wrap.style.height = `${String(viewport.height)}px`;
  wrap.appendChild(canvas);

  const textLayer = document.createElement('div');
  textLayer.className = 'textLayer';
  wrap.appendChild(textLayer);

  const textContent = await page.getTextContent();
  appendTextLayer(textContent, viewport, textLayer);

  const pageHighlights = highlightBlocks.filter((b) => b.page === pageNum);
  pageHighlights.forEach((block, i) => {
    const mark = document.createElement('div');
    mark.className =
      i === 0 && pageHighlights.length > 0
        ? 'pdf-block-highlight pdf-block-highlight-active'
        : 'pdf-block-highlight';
    mark.style.left = `${String(block.x * 100)}%`;
    mark.style.top = `${String(block.y * 100)}%`;
    mark.style.width = `${String(Math.max(block.width * 100, 0.4))}%`;
    mark.style.height = `${String(Math.max(block.height * 100, 0.35))}%`;
    wrap.appendChild(mark);
  });

  appendLayoutOverlays(
    wrap,
    pageNum,
    layoutOverlays,
    layoutOverlayEnabled,
    activeLayoutOverlayId,
    onLayoutOverlaySelect,
    onLayoutOverlayHover
  );

  bindPageClick(wrap, pageNum, onPageClick);

  return wrap;
}

async function resolveRenderScale(
  pdf: pdfjs.PDFDocumentProxy,
  pageNum: number,
  fitWidth: boolean,
  containerWidth: number | null
): Promise<number> {
  if (!fitWidth || containerWidth == null || containerWidth <= 0) {
    return DEFAULT_PAGE_SCALE;
  }
  const page = await pdf.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const available = containerWidth - PDF_PAGES_HORIZONTAL_PADDING_PX;
  if (available <= 0 || base.width <= 0) {
    return DEFAULT_PAGE_SCALE;
  }
  return Math.min(DEFAULT_PAGE_SCALE, available / base.width);
}

export function PdfViewer({
  url,
  data,
  highlightBlocks = NO_HIGHLIGHTS,
  layoutOverlays = NO_LAYOUT_OVERLAYS,
  layoutOverlayEnabled = false,
  activeLayoutOverlayId = null,
  onLayoutOverlaySelect,
  onLayoutOverlayHover,
  onLayoutOverlayClear,
  paginated = true,
  fitWidth = false,
  page: controlledPage,
  onPageChange,
  onPageClick,
}: PdfViewerProps) {
  const { t } = useTranslation();
  const pagesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const onPageClickRef = useRef(onPageClick);
  const onLayoutOverlaySelectRef = useRef(onLayoutOverlaySelect);
  const onLayoutOverlayHoverRef = useRef(onLayoutOverlayHover);
  useEffect(() => {
    onPageClickRef.current = onPageClick;
  }, [onPageClick]);
  useEffect(() => {
    onLayoutOverlaySelectRef.current = onLayoutOverlaySelect;
  }, [onLayoutOverlaySelect]);
  useEffect(() => {
    onLayoutOverlayHoverRef.current = onLayoutOverlayHover;
  }, [onLayoutOverlayHover]);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerWidthRef = useRef<number | null>(null);
  const lastPageRenderKeyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const [renderedPages, setRenderedPages] = useState(0);
  const [docToken, setDocToken] = useState(0);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [virtualRenderWindow, setVirtualRenderWindow] = useState<Set<number>>(() => new Set([1]));
  const virtualSlotsBuiltRef = useRef(false);
  const virtualIoRef = useRef<IntersectionObserver | null>(null);
  const lastVirtualLayoutKeyRef = useRef<string | null>(null);

  const isControlled = controlledPage !== undefined && onPageChange !== undefined;
  const currentPage = isControlled ? controlledPage : internalPage;
  const highlightKey = JSON.stringify(highlightBlocks);
  const overlayKey = JSON.stringify({
    overlays: layoutOverlays,
    enabled: layoutOverlayEnabled,
    active: activeLayoutOverlayId,
  });
  const sourceKey = data ? `buf:${String(data.byteLength)}` : (url ?? '');

  const setPage = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), Math.max(1, pageCount));
      if (isControlled && onPageChange) {
        onPageChange(clamped);
      } else {
        setInternalPage(clamped);
      }
    },
    [isControlled, onPageChange, pageCount]
  );

  useEffect(() => {
    const pagesHost = pagesRef.current;
    if (!pagesHost || (!url && !data)) return;

    let cancelled = false;
    pdfDocRef.current = null;
    pagesHost.replaceChildren();
    setLoading(true);
    setError(null);
    setPageCount(0);
    setRenderedPages(0);
    setPageSizes([]);
    virtualSlotsBuiltRef.current = false;
    if (!isControlled) {
      setInternalPage(1);
    }

    void (async () => {
      try {
        const docParams = data ? { data: data.slice(0) } : url;
        if (!docParams) return;

        const pdf = await pdfjs.getDocument(docParams).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        const sizes = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, index) =>
            pdf.getPage(index + 1).then((page) => {
              const vp = page.getViewport({ scale: 1 });
              return { width: vp.width, height: vp.height };
            })
          )
        );
        if (cancelled) return;
        setPageSizes(sizes);
        setVirtualRenderWindow(computeVirtualPageWindow([1], pdf.numPages));
        virtualSlotsBuiltRef.current = false;
        setDocToken((t) => t + 1);
      } catch (err) {
        if (!cancelled) {
          setError(formatUserFacingError(err, 'errors.pdfLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current = null;
    };
  }, [sourceKey, url, isControlled, t]);

  useEffect(() => {
    if (!fitWidth) {
      containerWidthRef.current = null;
      setContainerWidth(null);
      return;
    }
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateWidth = () => {
      const w = scrollEl.clientWidth;
      const rounded = Math.round(w);
      if (rounded <= 0) return;
      const prev = containerWidthRef.current;
      if (prev != null && Math.abs(prev - rounded) < CONTAINER_WIDTH_STABLE_DELTA_PX) return;
      containerWidthRef.current = rounded;
      setContainerWidth(rounded);
    };

    updateWidth();
    let rafId = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { updateWidth(); });
    });
    observer.observe(scrollEl);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [fitWidth, sourceKey]);

  useEffect(() => {
    if (!paginated) return;
    const pagesHost = pagesRef.current;
    const pdf = pdfDocRef.current;
    if (!pagesHost || !pdf || pageCount < 1 || docToken === 0) return;
    if (fitWidth && containerWidth == null) return;

    let cancelled = false;

    void (async () => {
      try {
        const highlights = highlightBlocks ?? NO_HIGHLIGHTS;

        const scale = await resolveRenderScale(
          pdf,
          currentPage,
          fitWidth,
          containerWidth
        );

        const renderKey = `${String(docToken)}:${String(currentPage)}:${String(Math.round(scale * 1000))}:${String(containerWidth ?? 0)}:${highlightKey}:${overlayKey}:paginated`;
        if (lastPageRenderKeyRef.current === renderKey && pagesHost.childElementCount > 0) {
          return;
        }
        lastPageRenderKeyRef.current = renderKey;

        if (cancelled) return;
        const hadPages = pagesHost.childElementCount > 0;
        if (!hadPages) setLoading(true);

        const pdfPage = await pdf.getPage(currentPage);
        if (cancelled) return;
        const wrap = await renderPdfPage(
          pdfPage,
          currentPage,
          highlights,
          layoutOverlays,
          layoutOverlayEnabled,
          activeLayoutOverlayId,
          scale,
          (p, nx, ny) => onPageClickRef.current?.(p, nx, ny),
          (id) => onLayoutOverlaySelectRef.current?.(id),
          (o) => onLayoutOverlayHoverRef.current?.(o)
        );
        if (cancelled) return;
        pagesHost.replaceChildren(wrap);
        setRenderedPages(1);
      } catch (err) {
        if (!cancelled) {
          setError(formatUserFacingError(err, 'errors.pdfPageLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    docToken,
    pageCount,
    paginated,
    currentPage,
    highlightKey,
    highlightBlocks,
    overlayKey,
    layoutOverlays,
    layoutOverlayEnabled,
    activeLayoutOverlayId,
    fitWidth,
    containerWidth,
    t,
  ]);

  useEffect(() => {
    if (paginated) return;
    const pagesHost = pagesRef.current;
    const pdf = pdfDocRef.current;
    if (!pagesHost || !pdf || pageCount < 1 || docToken === 0) return;
    if (pageSizes.length < pageCount) return;
    if (fitWidth && containerWidth == null) return;

    let cancelled = false;
    void (async () => {
      try {
        const scale = await resolveRenderScale(pdf, 1, fitWidth, containerWidth);
        const layoutKey = `${String(docToken)}:${String(Math.round(scale * 1000))}:${String(containerWidth ?? 0)}:${String(pageCount)}`;
        if (lastVirtualLayoutKeyRef.current === layoutKey && virtualSlotsBuiltRef.current) {
          return;
        }
        lastVirtualLayoutKeyRef.current = layoutKey;
        pagesHost.replaceChildren();
        for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
          const size = pageSizes[pageNum - 1];
          const slot = document.createElement('div');
          slot.className = 'pdf-page-slot';
          slot.dataset.page = String(pageNum);
          if (size && size.width > 0) {
            slot.style.width = `${String(size.width * scale)}px`;
            slot.style.minHeight = `${String(size.height * scale)}px`;
          }
          pagesHost.appendChild(slot);
        }
        virtualSlotsBuiltRef.current = true;
        setVirtualRenderWindow(computeVirtualPageWindow([currentPage], pageCount));
      } catch (err) {
        if (!cancelled) {
          setError(formatUserFacingError(err, 'errors.pdfPageLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    paginated,
    docToken,
    pageCount,
    pageSizes,
    fitWidth,
    containerWidth,
    currentPage,
    t,
  ]);

  useEffect(() => {
    if (paginated) return;
    const pagesHost = pagesRef.current;
    const pdf = pdfDocRef.current;
    if (!pagesHost || !pdf || pageCount < 1 || docToken === 0) return;
    if (!virtualSlotsBuiltRef.current) return;
    if (fitWidth && containerWidth == null) return;

    let cancelled = false;
    void (async () => {
      try {
        const highlights = highlightBlocks ?? NO_HIGHLIGHTS;
        const scale = await resolveRenderScale(pdf, 1, fitWidth, containerWidth);
        const renderStamp = `${String(Math.round(scale * 1000))}:${overlayKey}:${highlightKey}`;

        for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
          if (virtualRenderWindow.has(pageNum)) continue;
          const slot = pagesHost.querySelector<HTMLElement>(
            `.pdf-page-slot[data-page="${String(pageNum)}"]`
          );
          if (!slot?.dataset.renderStamp) continue;
          slot.replaceChildren();
          delete slot.dataset.renderStamp;
        }

        await Promise.all(
          [...virtualRenderWindow].map(async (pageNum) => {
            const slot = pagesHost.querySelector<HTMLElement>(
              `.pdf-page-slot[data-page="${String(pageNum)}"]`
            );
            if (!slot) return;
            if (slot.dataset.renderStamp === renderStamp && slot.childElementCount > 0) {
              return;
            }
            const pdfPage = await pdf.getPage(pageNum);
            if (cancelled) return;
            const wrap = await renderPdfPage(
              pdfPage,
              pageNum,
              highlights,
              layoutOverlays,
              layoutOverlayEnabled,
              activeLayoutOverlayId,
              scale,
              (p, nx, ny) => onPageClickRef.current?.(p, nx, ny),
              (id) => onLayoutOverlaySelectRef.current?.(id),
              (o) => onLayoutOverlayHoverRef.current?.(o)
            );
            if (cancelled) return;
            slot.replaceChildren(wrap);
            slot.dataset.renderStamp = renderStamp;
          })
        );
        if (!cancelled) {
          setRenderedPages(virtualRenderWindow.size);
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatUserFacingError(err, 'errors.pdfPageLoadFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    paginated,
    docToken,
    pageCount,
    virtualRenderWindow,
    highlightKey,
    highlightBlocks,
    overlayKey,
    layoutOverlays,
    layoutOverlayEnabled,
    activeLayoutOverlayId,
    fitWidth,
    containerWidth,
    t,
  ]);

  useEffect(() => {
    if (paginated || pageCount < 1) return;
    const root = scrollRef.current;
    const host = pagesRef.current;
    if (!root || !host) return;

    virtualIoRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set<number>();
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const page = Number((entry.target as HTMLElement).dataset.page);
          if (page > 0) visible.add(page);
        }
        if (visible.size === 0) return;
        setVirtualRenderWindow((prev) => {
          const next = computeVirtualPageWindow(visible, pageCount);
          if (next.size === prev.size && [...next].every((p) => prev.has(p))) return prev;
          return next;
        });
      },
      { root, rootMargin: '120% 0px', threshold: 0.01 }
    );
    host.querySelectorAll('.pdf-page-slot').forEach((el) => { observer.observe(el); });
    virtualIoRef.current = observer;
    return () => { observer.disconnect(); };
  }, [paginated, pageCount, docToken, pageSizes.length]);

  useEffect(() => {
    if (paginated || pageCount < 1) return;
    const host = pagesRef.current;
    if (!host) return;
    const slot = host.querySelector(`.pdf-page-slot[data-page="${String(currentPage)}"]`);
    slot?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [paginated, currentPage, pageCount, docToken]);

  useEffect(() => {
    if (!onLayoutOverlayClear) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onLayoutOverlayClear();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [onLayoutOverlayClear]);

  useEffect(() => {
    lastPageRenderKeyRef.current = null;
    lastVirtualLayoutKeyRef.current = null;
  }, [sourceKey]);

  return (
    <div className="pdf-viewer">
      <div className="pdf-viewer-toolbar">
        {paginated && pageCount > 0 ? (
          <div className="pdf-viewer-pager">
            <Button
              type="button"
              variant="ghost"
              className="pdf-viewer-pager-btn"
              disabled={currentPage <= 1 || loading}
              onClick={() => { setPage(currentPage - 1); }}
              aria-label={t('documents.pdfPrevPage')}
            >
              ←
            </Button>
            <span className="muted pdf-viewer-meta">
              {t('documents.pdfPageOf', { current: currentPage, total: pageCount })}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="pdf-viewer-pager-btn"
              disabled={currentPage >= pageCount || loading}
              onClick={() => { setPage(currentPage + 1); }}
              aria-label={t('documents.pdfNextPage')}
            >
              →
            </Button>
          </div>
        ) : pageCount > 0 ? (
          <span className="muted pdf-viewer-meta">
            {renderedPages < pageCount
              ? t('documents.pdfPagesProgress', { loaded: renderedPages, total: pageCount })
              : t('documents.pdfPageCount', { count: pageCount })}
          </span>
        ) : (
          <span className="muted pdf-viewer-meta">
            {loading ? t('documents.pdfLoading') : t('documents.pdfNoPages')}
          </span>
        )}
      </div>
      {error ? (
        <p className="error pdf-viewer-error" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className={`pdf-viewer-scroll${fitWidth ? ' pdf-viewer-scroll-fit-width' : ''}`}
        ref={scrollRef}
      >
        <div
          className={`pdf-pages${paginated ? ' pdf-pages-single' : ''}`}
          ref={pagesRef}
        />
      </div>
    </div>
  );
}
