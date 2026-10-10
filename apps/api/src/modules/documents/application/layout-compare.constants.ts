// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Must match worker `LAYOUT_COMPARE_MAX_METRICS_BATCH` default. */
export const LAYOUT_COMPARE_MAX_METRICS_BATCH = 25;

export function layoutComparePageNumbersInRange(
  pageCount: number,
  from?: number,
  to?: number
): number[] {
  if (pageCount < 1) {
    return [];
  }
  const start = from ?? 1;
  const end = to ?? Math.min(pageCount, LAYOUT_COMPARE_MAX_METRICS_BATCH);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
    return [];
  }
  const clampedEnd = Math.min(end, pageCount);
  const clampedStart = Math.min(Math.max(1, start), clampedEnd);
  const pages: number[] = [];
  for (let page = clampedStart; page <= clampedEnd; page += 1) {
    pages.push(page);
  }
  if (pages.length > LAYOUT_COMPARE_MAX_METRICS_BATCH) {
    return pages.slice(0, LAYOUT_COMPARE_MAX_METRICS_BATCH);
  }
  return pages;
}
