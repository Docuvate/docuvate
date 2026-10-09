// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDocumentContentBlob } from '../../lib/api';
import { isImageMime, isPdfMime } from './libraryDocumentUtils';

interface DocumentThumbProps {
  documentId: string;
  mimeType: string;
  title: string;
}

export function DocumentThumb({ documentId, mimeType, title }: DocumentThumbProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isImageMime(mimeType)) {
      return;
    }
    const node = rootRef.current;
    if (!node) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (!visible || objectUrl || cancelled) return;
        void fetchDocumentContentBlob(documentId)
          .then((blob) => {
            if (cancelled) return;
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
          })
          .catch(() => {
            if (!cancelled) setFailed(true);
          });
      },
      { rootMargin: '80px' }
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, mimeType]);

  const pdf = isPdfMime(mimeType);
  const image = isImageMime(mimeType);

  return (
    <div ref={rootRef} className="doc-thumb" aria-hidden={title ? undefined : true}>
      {url ? <img src={url} alt="" className="doc-thumb-image" /> : null}
      {!url && pdf ? <span className="doc-thumb-fallback">PDF</span> : null}
      {!url && image && !failed ? (
        <span className="doc-thumb-fallback doc-thumb-loading">…</span>
      ) : null}
      {!url && !pdf && !image ? (
        <span className="doc-thumb-fallback">{t('library.thumbFile')}</span>
      ) : null}
      {!url && image && failed ? (
        <span className="doc-thumb-fallback">{t('library.thumbImage')}</span>
      ) : null}
    </div>
  );
}
