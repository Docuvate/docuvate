// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDocumentLayoutHtml } from '../../lib/api';
import { ExtractedLayoutFallback } from './ExtractedLayoutFallback';

export const LAYOUT_IR_ZOOM_STEPS = [100, 150, 200] as const;
export type LayoutIrZoomStep = (typeof LAYOUT_IR_ZOOM_STEPS)[number];

interface ExtractedLayoutHtmlFrameProps {
  documentId: string;
  layoutIr: LayoutIrDocument;
  activePage: number;
  pageSynced: boolean;
  pageCount: number;
  zoom: LayoutIrZoomStep;
  requeueBusy?: boolean;
  onRequeueExtraction?: () => void;
  /** When true, keep the aspect-ratio skeleton and do not request HTML yet. */
  suspendHtmlFetch?: boolean;
}

function ptToPx(pt: number): number {
  return (pt * 96) / 72;
}

export function ExtractedLayoutHtmlFrame({
  documentId,
  layoutIr,
  activePage,
  pageSynced,
  pageCount,
  zoom,
  requeueBusy = false,
  onRequeueExtraction,
  suspendHtmlFetch = false,
}: ExtractedLayoutHtmlFrameProps) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [naturalWidthPx, setNaturalWidthPx] = useState(0);
  const [naturalHeightPx, setNaturalHeightPx] = useState(0);
  const [hostWidth, setHostWidth] = useState(0);

  const firstPage = layoutIr.pages[0];
  const skeletonWidth = firstPage ? ptToPx(firstPage.widthPt) : 612;
  const skeletonHeight = firstPage ? ptToPx(firstPage.heightPt) : 792;
  const pageGapPx = 16;
  const totalNaturalHeight =
    naturalHeightPx > 0
      ? naturalHeightPx * pageCount + pageGapPx * Math.max(0, pageCount - 1)
      : skeletonHeight * pageCount + pageGapPx * Math.max(0, pageCount - 1);

  const remeasure = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    const pageEls = Array.from(doc.querySelectorAll<HTMLElement>('.page'));
    if (pageEls.length === 0) return;
    const first = pageEls[0];
    const w = first.offsetWidth;
    const totalHeight = pageEls.reduce((sum, page) => sum + page.offsetHeight, 0);
    setNaturalWidthPx(w);
    setNaturalHeightPx(totalHeight / pageEls.length);
  }, []);

  useEffect(() => {
    if (suspendHtmlFetch) {
      setHtml(null);
      setError(null);
      setNaturalWidthPx(0);
      setNaturalHeightPx(0);
      return;
    }
    let active = true;
    setHtml(null);
    setError(null);
    setNaturalWidthPx(0);
    setNaturalHeightPx(0);
    void fetchDocumentLayoutHtml(documentId)
      .then((payload) => {
        if (active) setHtml(payload.html);
      })
      .catch(() => {
        if (active) setError('layout');
      });
    return () => {
      active = false;
    };
  }, [documentId, suspendHtmlFetch]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measureHost = () => setHostWidth(host.clientWidth);
    measureHost();
    const observer = new ResizeObserver(measureHost);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !pageSynced || pageCount < 2 || !html) return;
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const pageEl = doc?.querySelector(`.page[data-page="${activePage}"]`);
    pageEl?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [activePage, pageSynced, pageCount, html]);

  const effectiveHostWidth = hostWidth > 0 ? hostWidth : skeletonWidth;
  const baseScale = naturalWidthPx > 0 ? Math.min(1, effectiveHostWidth / naturalWidthPx) : 1;
  const scale = baseScale * (zoom / 100);
  const displayWidth = naturalWidthPx > 0 ? naturalWidthPx * scale : skeletonWidth * scale;
  const displayHeight = totalNaturalHeight * scale;
  const iframeNaturalHeight = totalNaturalHeight;

  if (error) {
    return (
      <ExtractedLayoutFallback
        variant="htmlFailed"
        requeueBusy={requeueBusy}
        onRequeue={onRequeueExtraction}
      />
    );
  }

  const loading = suspendHtmlFetch || !html;

  return (
    <div className="layout-ir-preview layout-ir-html-host" ref={hostRef} aria-busy={loading}>
      {loading ? (
        <p className="visually-hidden" aria-live="polite">
          {t('documents.layoutIrLoading')}
        </p>
      ) : null}
      <div
        className="layout-ir-skeleton"
        style={{
          width: '100%',
          maxWidth: skeletonWidth,
          aspectRatio: `${skeletonWidth} / ${skeletonHeight}`,
          visibility: loading ? 'visible' : 'hidden',
          position: loading ? 'relative' : 'absolute',
          height: loading ? undefined : 0,
          overflow: 'hidden',
          margin: loading ? undefined : 0,
          padding: 0,
          border: 0,
        }}
        aria-hidden={!loading}
      />
      {html ? (
        <div
          className="layout-ir-scale-outer"
          style={{ width: displayWidth, height: displayHeight, margin: '0 auto' }}
        >
          <div
            className="layout-ir-scale-inner"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: naturalWidthPx > 0 ? naturalWidthPx : skeletonWidth,
            }}
          >
            <iframe
              ref={iframeRef}
              title={t('documents.layoutIrPreviewTitle')}
              className="layout-ir-html-frame"
              sandbox="allow-same-origin"
              srcDoc={html}
              scrolling="no"
              style={{ height: iframeNaturalHeight }}
              onLoad={remeasure}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
