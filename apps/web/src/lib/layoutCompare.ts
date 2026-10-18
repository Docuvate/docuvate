// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface LayoutCompareSummary {
  category: string;
  ssimFloor: number;
  pageCount: number;
}

export interface LayoutComparePageMetric {
  pageNumber: number;
  ssim: number | null;
  inkDeviation: number | null;
  pageReliable: boolean;
  errorCode: string | null;
}

export interface LayoutCompareMetrics {
  category: string;
  ssimFloor: number;
  pageCount: number;
  pages: LayoutComparePageMetric[];
}

export interface LayoutComparePagePayload {
  pageNumber: number;
  ssim: number | null;
  inkDeviation: number | null;
  ssimFloor: number;
  pageReliable: boolean;
  widthPx: number;
  heightPx: number;
  originalPngBase64: string;
  reconstructionPngBase64: string;
  heatmapPngBase64: string | null;
  errorCode: string | null;
}

export function pngDataUrl(base64: string): string {
  if (!base64) return '';
  return `data:image/png;base64,${base64}`;
}

export function formatSsimScore(ssim: number, locale: string): string {
  const percent = ssim * 100;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent);
}

export const LAYOUT_COMPARE_VIRTUAL_PAGE_THRESHOLD = 12;
export const LAYOUT_COMPARE_PAGE_WINDOW_RADIUS = 10;
export const LAYOUT_COMPARE_METRICS_BATCH = 25;

export function layoutCompareVisiblePageRange(
  pageCount: number,
  activePage: number,
  radius = LAYOUT_COMPARE_PAGE_WINDOW_RADIUS
): { start: number; end: number } {
  if (pageCount <= LAYOUT_COMPARE_VIRTUAL_PAGE_THRESHOLD) {
    return { start: 1, end: pageCount };
  }
  const start = Math.max(1, activePage - radius);
  const end = Math.min(pageCount, activePage + radius);
  return { start, end };
}

export function layoutCompareAdjacentPage(
  key: string,
  activePage: number,
  pageCount: number
): number | null {
  if (key === 'ArrowLeft' || key === 'PageUp') {
    return activePage > 1 ? activePage - 1 : null;
  }
  if (key === 'ArrowRight' || key === 'PageDown') {
    return activePage < pageCount ? activePage + 1 : null;
  }
  return null;
}

export function layoutCompareSliderStep(key: string, position: number): number | null {
  if (key === 'ArrowLeft') {
    return Math.max(0, position - 5);
  }
  if (key === 'ArrowRight') {
    return Math.min(100, position + 5);
  }
  return null;
}

export function layoutCompareMetricsRange(
  pageCount: number,
  activePage: number
): { from: number; to: number } {
  const { start, end } = layoutCompareVisiblePageRange(pageCount, activePage);
  const span = end - start + 1;
  if (span <= LAYOUT_COMPARE_METRICS_BATCH) {
    return { from: start, to: end };
  }
  const half = Math.floor(LAYOUT_COMPARE_METRICS_BATCH / 2);
  const from = Math.max(1, activePage - half);
  const to = Math.min(pageCount, from + LAYOUT_COMPARE_METRICS_BATCH - 1);
  return { from, to: Math.min(to, end) };
}
