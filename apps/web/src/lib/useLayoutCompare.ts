// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchDocumentLayoutCompareMetrics,
  fetchDocumentLayoutComparePage,
} from './api';
import type { LayoutCompareMetrics, LayoutComparePagePayload } from './layoutCompare';

type CompareLoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useLayoutCompare(documentId: string, enabled: boolean) {
  const [metricsState, setMetricsState] = useState<CompareLoadState>('idle');
  const [metrics, setMetrics] = useState<LayoutCompareMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [pageState, setPageState] = useState<CompareLoadState>('idle');
  const [pagePayload, setPagePayload] = useState<LayoutComparePagePayload | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const pageCacheRef = useRef<Map<string, LayoutComparePagePayload>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setMetricsState('loading');
    setMetricsError(null);
    void fetchDocumentLayoutCompareMetrics(documentId)
      .then((data) => {
        if (!active) return;
        setMetrics(data);
        setMetricsState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setMetricsState('error');
        setMetricsError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [documentId, enabled]);

  const loadPage = useCallback(
    async (pageNumber: number, includeHeatmap: boolean) => {
      const cacheKey = `${pageNumber}:${includeHeatmap ? '1' : '0'}`;
      const cached = pageCacheRef.current.get(cacheKey);
      if (cached) {
        setPagePayload(cached);
        setPageState('ready');
        setPageError(null);
        return;
      }
      setPageState('loading');
      setPageError(null);
      try {
        const data = await fetchDocumentLayoutComparePage(documentId, pageNumber, includeHeatmap);
        pageCacheRef.current.set(cacheKey, data);
        setPagePayload(data);
        setPageState('ready');
      } catch (err: unknown) {
        setPageState('error');
        setPageError(err instanceof Error ? err.message : String(err));
      }
    },
    [documentId]
  );

  return {
    metrics,
    metricsState,
    metricsError,
    pagePayload,
    pageState,
    pageError,
    loadPage,
  };
}
