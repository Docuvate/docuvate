// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import type { z } from 'zod';
import type {
  LayoutCompareMetricsWorker,
  LayoutComparePageWorker,
  LayoutCompareSummaryWorker,
} from './layout-compare-worker.schema.js';
import { workerApiUrl } from './worker-api-path.js';
import {
  fetchWorkerJson,
  workerLayoutTimeoutError,
} from './worker-fetch.js';
import {
  mapWorkerLayoutCompareHttpError,
  parseWorkerLayoutCompareErrorCode,
} from './layout-compare-worker.errors.js';
import { workerRequestHeaders } from './worker-request-headers.js';

const LAYOUT_COMPARE_TIMEOUT_MS = 180_000;

async function postLayoutCompareWorker<T>(
  workerUrl: string,
  path: string,
  body: Record<string, unknown>,
  schema: z.ZodType<T>
): Promise<T> {
  const raw = await fetchWorkerJson<unknown>(
    workerApiUrl(workerUrl, path),
    {
      method: 'POST',
      headers: workerRequestHeaders(),
      body: JSON.stringify(body),
    },
    LAYOUT_COMPARE_TIMEOUT_MS,
    {
      onTimeout: workerLayoutTimeoutError,
      onHttpError: (status, body) =>
        mapWorkerLayoutCompareHttpError(status, parseWorkerLayoutCompareErrorCode(body)),
    }
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Layout compare worker returned an invalid payload');
  }
  return parsed.data;
}

export async function workerLayoutCompareSummary(
  workerUrl: string,
  layoutIr: LayoutIrDocument,
  originalPdfBase64: string,
  schema: z.ZodType<LayoutCompareSummaryWorker>
) {
  return postLayoutCompareWorker(workerUrl, '/layout/compare-summary', {
    layoutIr,
    originalPdfBase64,
  }, schema);
}

export async function workerLayoutCompareMetrics(
  workerUrl: string,
  layoutIr: LayoutIrDocument,
  originalPdfBase64: string,
  pageNumbers: number[],
  schema: z.ZodType<LayoutCompareMetricsWorker>,
  dpi = 100
) {
  return postLayoutCompareWorker(workerUrl, '/layout/compare-metrics', {
    layoutIr,
    originalPdfBase64,
    pageNumbers,
    dpi,
  }, schema);
}

export async function workerLayoutComparePage(
  workerUrl: string,
  layoutIr: LayoutIrDocument,
  originalPdfBase64: string,
  pageNumber: number,
  includeHeatmap: boolean,
  schema: z.ZodType<LayoutComparePageWorker>,
  dpi = 100
) {
  return postLayoutCompareWorker(workerUrl, '/layout/compare-page', {
    layoutIr,
    originalPdfBase64,
    pageNumber,
    includeHeatmap,
    dpi,
  }, schema);
}
