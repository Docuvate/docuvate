// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  computeDocumentCoverage,
  LABEL_CONTENT_SIM_THRESHOLD,
  summarizeCoverage,
} from './label-coverage.js';

describe('computeDocumentCoverage', () => {
  const centroids = [
    { tagId: 'a', centroid: [1, 0, 0] },
    { tagId: 'b', centroid: [0, 1, 0] },
  ];

  it('marks labeled doc as explained when close to assigned centroid', () => {
    const result = computeDocumentCoverage([0.95, 0.1, 0], ['a'], centroids);
    expect(result.status).toBe('explained');
    expect(result.bestAssignedSimilarity).toBeGreaterThanOrEqual(LABEL_CONTENT_SIM_THRESHOLD);
  });

  it('marks labeled doc as unexplained when far from assigned centroid', () => {
    const result = computeDocumentCoverage([0, 0.95, 0.1], ['a'], centroids);
    expect(result.status).toBe('unexplained');
    expect(result.bestAssignedSimilarity).toBeLessThan(LABEL_CONTENT_SIM_THRESHOLD);
  });

  it('marks unlabeled doc outside when far from all centroids', () => {
    const result = computeDocumentCoverage([0, 0, 1], [], centroids);
    expect(result.status).toBe('outside');
    expect(result.bestAssignedSimilarity).toBeNull();
  });

  it('marks unlabeled doc near when similar to a label centroid', () => {
    const result = computeDocumentCoverage([0.9, 0.05, 0.05], [], centroids);
    expect(result.status).toBe('unlabeled_near');
  });
});

describe('summarizeCoverage', () => {
  it('counts statuses', () => {
    const summary = summarizeCoverage(['explained', 'explained', 'outside', 'unexplained']);
    expect(summary.explained).toBe(2);
    expect(summary.outside).toBe(1);
    expect(summary.unexplained).toBe(1);
    expect(summary.threshold).toBe(LABEL_CONTENT_SIM_THRESHOLD);
    expect(summary.gapCount).toBe(2);
    expect(summary.coveredPercent).toBe(50);
  });
});
