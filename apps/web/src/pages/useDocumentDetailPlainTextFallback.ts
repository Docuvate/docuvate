// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';

import { fetchDocumentContentBlob } from '../lib/api';

/** Load raw bytes as UTF-8 when extraction text is missing for a plain-text document. */
export function useDocumentDetailPlainTextFallback(
  documentId: string | undefined,
  isPlainText: boolean,
  extractionText: string | null | undefined
): string | null {
  const [plainTextFallback, setPlainTextFallback] = useState<string | null>(null);

  useEffect(() => {
    setPlainTextFallback(null);
  }, [documentId]);

  useEffect(() => {
    if (!documentId || !isPlainText) {
      return undefined;
    }
    if (extractionText?.trim()) {
      return undefined;
    }
    let cancelled = false;
    void fetchDocumentContentBlob(documentId)
      .then(async (blob) => {
        const text = await blob.text();
        if (!cancelled) {
          setPlainTextFallback(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlainTextFallback(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, extractionText, isPlainText]);

  return plainTextFallback;
}
