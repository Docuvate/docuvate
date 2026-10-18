// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { LayoutComparePageMetric } from './layoutCompare';

export type ReconstructionQualityTone = 'good' | 'review' | 'unknown';

export function reconstructionQualityTone(
  metricsByPage: Map<number, LayoutComparePageMetric>,
  ssimFloor: number
): ReconstructionQualityTone {
  if (metricsByPage.size === 0) {
    return 'unknown';
  }
  let hasScore = false;
  for (const metric of metricsByPage.values()) {
    if (metric.ssim == null) {
      continue;
    }
    hasScore = true;
    if (metric.ssim < ssimFloor) {
      return 'review';
    }
  }
  return hasScore ? 'good' : 'unknown';
}

export function firstPageBelowSsimFloor(
  metricsByPage: Map<number, LayoutComparePageMetric>,
  ssimFloor: number
): number | null {
  const pages: number[] = [];
  for (const [page, metric] of metricsByPage.entries()) {
    if (metric.ssim != null && metric.ssim < ssimFloor) {
      pages.push(page);
    }
  }
  if (pages.length === 0) {
    return null;
  }
  pages.sort((a, b) => a - b);
  return pages[0];
}
