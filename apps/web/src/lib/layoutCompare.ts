// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface LayoutComparePageMetric {
  pageNumber: number;
  ssim: number | null;
  inkDeviation: number | null;
  pageReliable: boolean;
  error: string | null;
}

export interface LayoutCompareMetrics {
  category: string;
  ssimFloor: number;
  pages: LayoutComparePageMetric[];
}

export interface LayoutComparePagePayload {
  pageNumber: number;
  ssim: number;
  inkDeviation: number;
  ssimFloor: number;
  pageReliable: boolean;
  widthPx: number;
  heightPx: number;
  originalPngBase64: string;
  reconstructionPngBase64: string;
  heatmapPngBase64: string | null;
  error: string | null;
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

export const LAYOUT_COMPARE_VIRTUAL_PAGE_THRESHOLD = 50;
export const LAYOUT_COMPARE_PAGE_WINDOW_RADIUS = 10;

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
