// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { layoutCompareVisiblePageRange } from './layoutCompare';

describe('layoutCompareVisiblePageRange', () => {
  it('returns full range for small documents', () => {
    expect(layoutCompareVisiblePageRange(12, 5)).toEqual({ start: 1, end: 12 });
  });

  it('windows around active page for large documents', () => {
    expect(layoutCompareVisiblePageRange(120, 60)).toEqual({ start: 50, end: 70 });
  });
});
