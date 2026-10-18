// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  layoutCompareAdjacentPage,
  layoutCompareMetricsRange,
  layoutCompareSliderStep,
  layoutCompareVisiblePageRange,
} from './layoutCompare';

describe('layoutCompareVisiblePageRange', () => {
  it('returns full range for small documents', () => {
    expect(layoutCompareVisiblePageRange(12, 5)).toEqual({ start: 1, end: 12 });
  });

  it('windows around active page for large documents', () => {
    expect(layoutCompareVisiblePageRange(120, 60)).toEqual({ start: 50, end: 70 });
  });
});

describe('layoutCompareAdjacentPage', () => {
  it('steps within document bounds', () => {
    expect(layoutCompareAdjacentPage('ArrowRight', 5, 12)).toBe(6);
    expect(layoutCompareAdjacentPage('ArrowLeft', 5, 12)).toBe(4);
    expect(layoutCompareAdjacentPage('PageDown', 12, 12)).toBeNull();
  });
});

describe('layoutCompareSliderStep', () => {
  it('nudges slider by five points', () => {
    expect(layoutCompareSliderStep('ArrowRight', 50)).toBe(55);
    expect(layoutCompareSliderStep('ArrowLeft', 3)).toBe(0);
  });
});

describe('layoutCompareMetricsRange', () => {
  it('caps batch size for large documents', () => {
    const range = layoutCompareMetricsRange(120, 60);
    expect(range.to - range.from + 1).toBeLessThanOrEqual(25);
    expect(range.from).toBeGreaterThanOrEqual(48);
    expect(range.to).toBeLessThanOrEqual(70);
  });
});
