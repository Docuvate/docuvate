// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';

import { fetchDocumentContentBlob, fetchDocumentPreviewBlob } from '../lib/api';
import { fetchDocumentPreviewBuffer } from '../lib/documentPreviewCache';

type DocumentPreviewFetchState = 'idle' | 'loading' | 'ready' | 'missing';

/** Fetch PDF/image preview bytes for the document detail viewer. */
export function useDocumentDetailPreviewBuffer(
  documentId: string | undefined,
  previewMime: string | undefined,
  previewAvailable: boolean
): { previewData: ArrayBuffer | null; previewFetchState: DocumentPreviewFetchState } {
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [previewFetchState, setPreviewFetchState] = useState<DocumentPreviewFetchState>('idle');

  useEffect(() => {
    if (!documentId || !previewMime) {
      setPreviewFetchState('idle');
      return undefined;
    }
    const wantsStoredPdf = previewAvailable;
    const wantsPdf = previewMime === 'application/pdf' || wantsStoredPdf;
    const wantsImage = previewMime.startsWith('image/');
    if (!wantsPdf && !wantsImage) {
      setPreviewFetchState('idle');
      return undefined;
    }

    let cancelled = false;
    setPreviewFetchState('loading');
    setPreviewData(null);
    const fetchBlob = () =>
      wantsStoredPdf
        ? fetchDocumentPreviewBlob(documentId)
        : fetchDocumentContentBlob(documentId);
    void fetchDocumentPreviewBuffer(documentId, fetchBlob)
      .then((buffer) => {
        if (cancelled) return;
        if (buffer.byteLength > 0) {
          setPreviewData(buffer);
          setPreviewFetchState('ready');
        } else {
          setPreviewData(null);
          setPreviewFetchState('missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewData(null);
          setPreviewFetchState('missing');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, previewAvailable, previewMime]);

  return { previewData, previewFetchState };
}
