// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { cosineSimilarity, mergeCentroid } from './cosine.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe('mergeCentroid', () => {
  it('starts from first sample', () => {
    expect(mergeCentroid(null, 0, [2, 4])).toEqual({
      centroid: [2, 4],
      sampleCount: 1,
    });
  });

  it('averages with prior centroid', () => {
    const { centroid, sampleCount } = mergeCentroid([0, 0], 1, [2, 4]);
    expect(centroid).toEqual([1, 2]);
    expect(sampleCount).toBe(2);
  });
});
