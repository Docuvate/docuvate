// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { computeCoverageSimilarity } from './label-coverage-score.js';

describe('computeCoverageSimilarity', () => {
  it('uses labeled documents as well as centroids', () => {
    const score = computeCoverageSimilarity(
      [0.98, 0.02],
      [{ tagId: 'far', centroid: [0, 1] }],
      [{ embedding: [1, 0], nonInboxTagIds: ['near'] }]
    );
    expect(score).toBeGreaterThan(0.9);
  });
});
