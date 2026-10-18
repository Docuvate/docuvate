// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock, NormalizedBBox } from '@docuvate/contracts';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { documentPreviewUrl } from '../../lib/api';
import { fetchDocumentPreviewBuffer } from '../../lib/documentPreviewCache';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const SNIPPET_HEIGHT_PX = 96;
const SNIPPET_MAX_WIDTH_PX = 480;
const CONTEXT_FRACTION = 0.06;

interface DocumentSnippetProps {
  documentId: string;
  page: number;
  bbox: NormalizedBBox;
  highlightBlocks?: ExtractionBlock[];
}

export function DocumentSnippet({ documentId, page, bbox }: DocumentSnippetProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(host);
    return () => { observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!visible || failed) return undefined;
    const cancelledRef = { current: false };
    void (async () => {
      try {
        const data = await fetchDocumentPreviewBuffer(documentId, () =>
          fetch(documentPreviewUrl(documentId), { credentials: 'include' }).then((res) => {
            if (!res.ok) throw new Error('preview');
            return res.blob();
          })
        );
        if (cancelledRef.current) return;
        const pdf = await pdfjs.getDocument({ data }).promise;
        const pdfPage = await pdf.getPage(page);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cropY = Math.max(0, bbox.y - CONTEXT_FRACTION);
        const cropH = Math.min(1 - cropY, bbox.height + CONTEXT_FRACTION * 2);
        const scale = SNIPPET_MAX_WIDTH_PX / viewport.width;
        const renderViewport = pdfPage.getViewport({ scale });
        const offscreen = document.createElement('canvas');
        offscreen.width = renderViewport.width;
        offscreen.height = renderViewport.height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        await pdfPage.render({ canvasContext: ctx, viewport: renderViewport }).promise;
        const sx = 0;
        const sy = cropY * renderViewport.height;
        const sw = renderViewport.width;
        const sh = cropH * renderViewport.height;
        canvas.width = SNIPPET_MAX_WIDTH_PX;
        canvas.height = SNIPPET_HEIGHT_PX;
        const out = canvas.getContext('2d');
        if (!out) return;
        out.drawImage(offscreen, sx, sy, sw, sh, 0, 0, SNIPPET_MAX_WIDTH_PX, SNIPPET_HEIGHT_PX);
        const hx = bbox.x * SNIPPET_MAX_WIDTH_PX;
        const hy = (bbox.y - cropY) / cropH * SNIPPET_HEIGHT_PX;
        const hw = bbox.width * SNIPPET_MAX_WIDTH_PX;
        const hh = (bbox.height / cropH) * SNIPPET_HEIGHT_PX;
        out.fillStyle = 'rgba(203, 58, 0, 0.15)';
        out.fillRect(hx, hy, hw, hh);
        out.strokeStyle = 'rgba(203, 58, 0, 1)';
        out.lineWidth = 1.5;
        out.strokeRect(hx + 0.75, hy + 0.75, Math.max(0, hw - 1.5), Math.max(0, hh - 1.5));
      } catch {
        if (!cancelledRef.current) setFailed(true);
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [bbox.height, bbox.width, bbox.x, bbox.y, documentId, failed, page, visible]);

  if (failed) {
    return null;
  }

  return (
    <div ref={hostRef} className="document-snippet" style={{ maxWidth: `${String(SNIPPET_MAX_WIDTH_PX / 16)}rem` }}>
      <canvas
        ref={canvasRef}
        className="document-snippet-canvas"
        height={SNIPPET_HEIGHT_PX}
        aria-label={t('documents.documentSnippetAria')}
      />
    </div>
  );
}
