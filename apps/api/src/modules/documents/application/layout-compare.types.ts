// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface LayoutComparePageMetric {
  pageNumber: number;
  ssim: number | null;
  inkDeviation: number | null;
  pageReliable: boolean;
  error: string | null;
}

export interface LayoutCompareMetricsResult {
  category: string;
  ssimFloor: number;
  pages: LayoutComparePageMetric[];
}

export interface LayoutComparePageResult {
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
