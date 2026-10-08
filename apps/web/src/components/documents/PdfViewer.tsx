import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as pdfjs from 'pdfjs-dist';
import { formatUserFacingError } from '../../lib/apiErrors';
import { Button } from '../ui/Button';

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

type PdfHighlightBlock = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const NO_HIGHLIGHTS: PdfHighlightBlock[] = [];

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
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - fontHeight}px`;
    span.style.fontSize = `${fontHeight}px`;
    span.style.transform = `rotate(${angle}rad)`;
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

async function renderPdfPage(
  page: pdfjs.PDFPageProxy,
  pageNum: number,
  highlightBlocks: PdfHighlightBlock[],
  scale: number,
  onPageClick?: (page: number, nx: number, ny: number) => void
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
  wrap.style.width = `${viewport.width}px`;
  wrap.style.height = `${viewport.height}px`;
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
    mark.style.left = `${block.x * 100}%`;
    mark.style.top = `${block.y * 100}%`;
    mark.style.width = `${Math.max(block.width * 100, 0.4)}%`;
    mark.style.height = `${Math.max(block.height * 100, 0.35)}%`;
    wrap.appendChild(mark);
  });

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
  useEffect(() => {
    onPageClickRef.current = onPageClick;
  }, [onPageClick]);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerWidthRef = useRef<number | null>(null);
  const lastPageRenderKeyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const [renderedPages, setRenderedPages] = useState(0);
  const [docToken, setDocToken] = useState(0);

  const isControlled = controlledPage !== undefined && onPageChange !== undefined;
  const currentPage = isControlled ? controlledPage : internalPage;
  const highlightKey = JSON.stringify(highlightBlocks);
  const sourceKey = data ? `buf:${data.byteLength}` : (url ?? '');

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
      rafId = requestAnimationFrame(() => updateWidth());
    });
    observer.observe(scrollEl);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [fitWidth, sourceKey]);

  useEffect(() => {
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
          paginated ? currentPage : 1,
          fitWidth,
          containerWidth
        );

        const renderKey = `${docToken}:${currentPage}:${Math.round(scale * 1000)}:${containerWidth ?? 0}:${highlightKey}:${paginated}`;
        if (lastPageRenderKeyRef.current === renderKey && pagesHost.childElementCount > 0) {
          return;
        }
        lastPageRenderKeyRef.current = renderKey;

        if (cancelled) return;
        const hadPages = pagesHost.childElementCount > 0;
        if (paginated && !hadPages) setLoading(true);

        if (paginated) {
          const pdfPage = await pdf.getPage(currentPage);
          if (cancelled) return;
          const wrap = await renderPdfPage(
            pdfPage,
            currentPage,
            highlights,
            scale,
            (p, nx, ny) => onPageClickRef.current?.(p, nx, ny)
          );
          if (cancelled) return;
          pagesHost.replaceChildren(wrap);
          setRenderedPages(1);
        } else {
          const pageNums = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
          const pages = await Promise.all(pageNums.map((num) => pdf.getPage(num)));
          if (cancelled) return;

          const wraps = await Promise.all(
            pages.map((p, index) =>
              renderPdfPage(p, index + 1, highlights, scale, (pg, nx, ny) =>
                onPageClickRef.current?.(pg, nx, ny)
              )
            )
          );
          if (cancelled) return;

          pagesHost.replaceChildren(...wraps);
          setRenderedPages(pdf.numPages);
        }
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
    fitWidth,
    containerWidth,
    t,
  ]);

  useEffect(() => {
    lastPageRenderKeyRef.current = null;
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
              onClick={() => setPage(currentPage - 1)}
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
              onClick={() => setPage(currentPage + 1)}
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
        <div className="pdf-pages pdf-pages-single" ref={pagesRef} />
      </div>
    </div>
  );
}
