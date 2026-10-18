// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface LayoutCompareSummaryResult {
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

export interface LayoutCompareMetricsResult {
  category: string;
  ssimFloor: number;
  pageCount: number;
  pages: LayoutComparePageMetric[];
}

export interface LayoutComparePageResult {
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
