// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { rectsOverlap } from './confidenceSliderOverlap';

function box(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

describe('rectsOverlap', () => {
  it('detects intersection', () => {
    expect(rectsOverlap(box(0, 0, 10, 10), box(5, 5, 10, 10))).toBe(true);
  });

  it('allows adjacent boxes', () => {
    expect(rectsOverlap(box(0, 0, 10, 10), box(10, 0, 10, 10))).toBe(false);
  });
});
