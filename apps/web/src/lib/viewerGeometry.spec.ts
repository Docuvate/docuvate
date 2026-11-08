// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  clientPointToLocalRatio,
  indexOfPageWrap,
  pageDisplayTransform,
  selectionPaintWrapIndex,
  visualWidthAfterQuarterTurn,
} from './viewerGeometry';

describe('viewerGeometry', () => {
  it('maps an unrotated point from the axis-aligned box', () => {
    const point = clientPointToLocalRatio(
      25,
      40,
      { left: 10, top: 20, width: 100, height: 200 },
      { width: 100, height: 200 },
      0
    );
    expect(point.x).toBeCloseTo(0.15);
    expect(point.y).toBeCloseTo(0.1);
  });

  it('maps the visual top of a 90° clockwise page back to the local left edge', () => {
    const point = clientPointToLocalRatio(
      50,
      0,
      { left: 0, top: 0, width: 100, height: 200 },
      { width: 200, height: 100 },
      90
    );
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(0.5);
  });

  it('keeps the rotated page center at the local center', () => {
    const point = clientPointToLocalRatio(
      50,
      100,
      { left: 0, top: 0, width: 100, height: 200 },
      { width: 200, height: 100 },
      90
    );
    expect(point.x).toBeCloseTo(0.5);
    expect(point.y).toBeCloseTo(0.5);
  });

  it('swaps fit width after a quarter turn and leaves 0° and 180° alone', () => {
    expect(visualWidthAfterQuarterTurn(200, 100, 0)).toBe(200);
    expect(visualWidthAfterQuarterTurn(200, 100, 180)).toBe(200);
    expect(visualWidthAfterQuarterTurn(200, 100, 90)).toBe(100);
    expect(visualWidthAfterQuarterTurn(200, 100, 270)).toBe(100);
  });

  it('emits a css rotation only when the page is turned', () => {
    expect(pageDisplayTransform(0)).toBe('');
    expect(pageDisplayTransform(90)).toBe('rotate(90deg)');
  });

  it('selects the requested page and does not fall back to the first page', () => {
    expect(indexOfPageWrap(['1', '2', '3'], 2)).toBe(1);
    expect(indexOfPageWrap(['1', '2'], 4)).toBeNull();
    expect(indexOfPageWrap([], 1)).toBeNull();
  });

  it('paints on the matching page, or the wrap the gesture already accepted', () => {
    expect(selectionPaintWrapIndex(['1', '2'], 2, 0, true)).toBe(1);
    expect(selectionPaintWrapIndex([null], 1, 0, true)).toBe(0);
    expect(selectionPaintWrapIndex([null], 1, 0, false)).toBeNull();
    expect(selectionPaintWrapIndex(['2'], 1, 0, true)).toBeNull();
    expect(selectionPaintWrapIndex(['1'], 4, null, false)).toBeNull();
  });
});
