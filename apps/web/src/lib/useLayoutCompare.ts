// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchDocumentLayoutCompareMetrics,
  fetchDocumentLayoutComparePage,
  fetchDocumentLayoutCompareSummary,
} from './api';
import {
  type LayoutCompareMetrics,
  layoutCompareMetricsRange,
  type LayoutComparePageMetric,
  type LayoutComparePagePayload,
  type LayoutCompareSummary,
} from './layoutCompare';
import { layoutCompareUserMessage } from './layoutCompareUserError';

type CompareLoadState = 'idle' | 'loading' | 'ready' | 'error' | 'timeout';

const SUMMARY_TIMEOUT_MS = 60_000;
const METRICS_TIMEOUT_MS = 300_000;
const PAGE_TIMEOUT_MS = 300_000;

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export function useLayoutCompare(
  documentId: string,
  enabled: boolean,
  pageCountHint: number,
  activePage: number,
  includeHeatmap: boolean
) {
  const [summaryState, setSummaryState] = useState<CompareLoadState>('idle');
  const [summary, setSummary] = useState<LayoutCompareSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [metricsState, setMetricsState] = useState<CompareLoadState>('idle');
  const [metricsByPage, setMetricsByPage] = useState<Map<number, LayoutComparePageMetric>>(
    () => new Map()
  );
  const [metricsMeta, setMetricsMeta] = useState<Pick<
    LayoutCompareMetrics,
    'category' | 'ssimFloor' | 'pageCount'
  > | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const metricsLoadedRef = useRef<Set<string>>(new Set());
  const [metricsRetryToken, setMetricsRetryToken] = useState(0);

  const [pageState, setPageState] = useState<CompareLoadState>('idle');
  const [pagePayload, setPagePayload] = useState<LayoutComparePagePayload | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const pageCacheRef = useRef<Map<string, LayoutComparePagePayload>>(new Map());
  const [pageRetryToken, setPageRetryToken] = useState(0);

  const effectivePageCount = summary?.pageCount ?? pageCountHint;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setSummaryState('loading');
    setSummaryError(null);
    void fetchDocumentLayoutCompareSummary(documentId, { timeoutMs: SUMMARY_TIMEOUT_MS })
      .then((data) => {
        if (!active) return;
        setSummary(data);
        setSummaryState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isAbortError(err)) {
          setSummaryState('timeout');
          setSummaryError(layoutCompareUserMessage(err));
          return;
        }
        setSummaryState('error');
        setSummaryError(layoutCompareUserMessage(err));
      });
    return () => {
      active = false;
    };
  }, [documentId, enabled]);

  useEffect(() => {
    if (!enabled || effectivePageCount < 1) return;
    const { from, to } = layoutCompareMetricsRange(effectivePageCount, activePage);
    const batchKey = `${String(from)}:${String(to)}`;
    if (metricsLoadedRef.current.has(batchKey)) {
      return;
    }
    let active = true;
    setMetricsState('loading');
    setMetricsError(null);
    void fetchDocumentLayoutCompareMetrics(documentId, from, to, {
      timeoutMs: METRICS_TIMEOUT_MS,
    })
      .then((data) => {
        if (!active) return;
        metricsLoadedRef.current.add(batchKey);
        setMetricsMeta({
          category: data.category,
          ssimFloor: data.ssimFloor,
          pageCount: data.pageCount,
        });
        setMetricsByPage((prev) => {
          const next = new Map(prev);
          for (const row of data.pages) {
            next.set(row.pageNumber, row);
          }
          return next;
        });
        setMetricsState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isAbortError(err)) {
          setMetricsState('timeout');
          setMetricsError(layoutCompareUserMessage(err));
          return;
        }
        setMetricsState('error');
        setMetricsError(layoutCompareUserMessage(err));
      });
    return () => {
      active = false;
    };
  }, [documentId, enabled, effectivePageCount, activePage, metricsRetryToken]);

  const loadPage = useCallback(
    async (pageNumber: number, includeHeatmap: boolean) => {
      const cacheKey = `${String(pageNumber)}:${includeHeatmap ? '1' : '0'}`;
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
        const data = await fetchDocumentLayoutComparePage(
          documentId,
          pageNumber,
          includeHeatmap,
          { timeoutMs: PAGE_TIMEOUT_MS }
        );
        pageCacheRef.current.set(cacheKey, data);
        setPagePayload(data);
        setPageState('ready');
      } catch (err: unknown) {
        if (isAbortError(err)) {
          setPageState('timeout');
          setPageError(layoutCompareUserMessage(err));
          return;
        }
        setPageState('error');
        setPageError(layoutCompareUserMessage(err));
      }
    },
    [documentId]
  );

  useEffect(() => {
    void loadPage(activePage, includeHeatmap);
  }, [activePage, includeHeatmap, loadPage, pageRetryToken]);

  const retryMetrics = useCallback(() => {
    metricsLoadedRef.current.clear();
    setMetricsRetryToken((n) => n + 1);
  }, []);

  const retryPage = useCallback(() => {
    const cacheKey = `${String(activePage)}:${includeHeatmap ? '1' : '0'}`;
    pageCacheRef.current.delete(cacheKey);
    setPageRetryToken((n) => n + 1);
  }, [activePage, includeHeatmap]);

  const retryAll = useCallback(() => {
    retryMetrics();
    retryPage();
  }, [retryMetrics, retryPage]);

  const metricsPages = Array.from(metricsByPage.values()).sort(
    (a, b) => a.pageNumber - b.pageNumber
  );

  return {
    summary,
    summaryState,
    summaryError,
    metrics: metricsMeta
      ? { ...metricsMeta, pages: metricsPages }
      : metricsPages.length > 0
        ? {
            category: '',
            ssimFloor: 0,
            pageCount: effectivePageCount,
            pages: metricsPages,
          }
        : null,
    metricsState,
    metricsError,
    metricsByPage,
    pagePayload,
    pageState,
    pageError,
    loadPage,
    retryMetrics,
    retryPage,
    retryAll,
  };
}
