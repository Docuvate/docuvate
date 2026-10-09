// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { buildLabelOverlapMatrix } from './label-overlap-matrix.js';

describe('buildLabelOverlapMatrix', () => {
  it('flags high-overlap pairs', () => {
    const matrix = buildLabelOverlapMatrix([
      {
        tagId: 'a',
        name: 'Alpha',
        centroid: [1, 0],
        docEmbeddings: [[0.99, 0.01]],
      },
      {
        tagId: 'b',
        name: 'Beta',
        centroid: [0.99, 0.01],
        docEmbeddings: [[1, 0]],
      },
      {
        tagId: 'c',
        name: 'Gamma',
        centroid: [0, 1],
        docEmbeddings: [[0, 1]],
      },
    ]);
    expect(matrix).not.toBeNull();
    expect(matrix!.similarities.length).toBe(3);
    expect(
      matrix!.highOverlapPairs.some((p) => p.tagNameA === 'Alpha' || p.tagNameB === 'Alpha')
    ).toBe(true);
    expect(matrix!.highOverlapPairs[0]?.mergeRecommendationId.startsWith('merge:')).toBe(true);
  });
});
