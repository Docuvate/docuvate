// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken, NormalizedRect } from '@docuvate/contracts';
import {
  remapRegionTokens,
  snapRectToTokenHull,
  tokenBelongsToRect,
  tokenCoverageRatio,
  tokensInsideRect,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

function token(
  blockIndex: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  text: string,
  page = 1
): LayoutToken {
  return { blockIndex, page, x0, y0, x1, y1, text };
}

describe('rectangle-to-token mapping (≥50% area)', () => {
  const rect: NormalizedRect = { x0: 0.1, y0: 0.1, x1: 0.4, y1: 0.2 };

  it('includes a token whose area is exactly 50% inside the rectangle', () => {
    // Token 0.2×0.1; left half (0.1×0.1) is inside → 50%.
    const half = token(1, 0.0, 0.1, 0.2, 0.2, 'half');
    expect(tokenCoverageRatio(half, rect)).toBeCloseTo(0.5);
    expect(tokenBelongsToRect(half, rect)).toBe(true);
  });

  it('excludes a token with 45% of its area inside the rectangle', () => {
    // Token width 0.2, height 0.1; overlap width 0.09 → 45%.
    const outside = token(2, -0.01, 0.1, 0.19, 0.2, 'out');
    expect(tokenCoverageRatio(outside, rect)).toBeCloseTo(0.45);
    expect(tokenBelongsToRect(outside, rect)).toBe(false);
  });

  it('includes a token fully inside and snaps the stored box to the hull', () => {
    const inside = token(3, 0.12, 0.12, 0.2, 0.18, '208,82');
    const neighbor = token(4, 0.5, 0.5, 0.6, 0.55, 'Nachbar');
    const selected = tokensInsideRect([inside, neighbor], rect);
    expect(selected.map((item) => item.blockIndex)).toEqual([3]);
    expect(snapRectToTokenHull(selected)).toEqual({
      x0: 0.12,
      y0: 0.12,
      x1: 0.2,
      y1: 0.18,
    });
  });
});

describe('geometry remapping after re-extraction', () => {
  const rect: NormalizedRect = { x0: 0.2, y0: 0.3, x1: 0.5, y1: 0.4 };

  it('re-resolves tokens by the same rectangle and marks text changes', () => {
    const previous = [token(10, 0.22, 0.31, 0.3, 0.38, '208,82 €')];
    const nextSame = [token(40, 0.22, 0.31, 0.3, 0.38, '208,82 €')];
    const unchanged = remapRegionTokens(previous, nextSame, rect);
    expect(unchanged.textChanged).toBe(false);
    expect(unchanged.tokens).toHaveLength(1);
    expect(unchanged.tokens[0].blockIndex).toBe(40);

    const nextChanged = [token(41, 0.22, 0.31, 0.3, 0.38, '210,00 €')];
    const changed = remapRegionTokens(previous, nextChanged, rect);
    expect(changed.textChanged).toBe(true);
    expect(changed.nextText).toBe('210,00 €');
    expect(changed.previousText).toBe('208,82 €');
  });

  it('marks review when the new IR has no overlapping tokens', () => {
    const previous = [token(10, 0.22, 0.31, 0.3, 0.38, '208,82 €')];
    const remapped = remapRegionTokens(previous, [token(99, 0.8, 0.8, 0.9, 0.9, 'Ende')], rect);
    expect(remapped.tokens).toEqual([]);
    expect(remapped.textChanged).toBe(true);
    expect(remapped.snappedRect).toBeNull();
  });
});
