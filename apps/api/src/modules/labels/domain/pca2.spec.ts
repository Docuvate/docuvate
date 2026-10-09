// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { normalizePlotCoords, projectTo2D } from './pca2.js';

describe('projectTo2D', () => {
  it('separates orthogonal clusters on first two axes', () => {
    const vectors = [
      [1, 0, 0],
      [1.1, 0.05, 0],
      [-1, 0, 0],
      [-0.95, -0.02, 0],
    ];
    const coords = projectTo2D(vectors);
    expect(coords).toHaveLength(4);
    const left = coords[0]![0] + coords[1]![0];
    const right = coords[2]![0] + coords[3]![0];
    expect(Math.sign(left)).not.toBe(Math.sign(right));
  });

  it('normalizePlotCoords stays within padded unit square', () => {
    const normalized = normalizePlotCoords([
      [0, 0],
      [10, 5],
    ]);
    for (const [x, y] of normalized) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
