// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
  binaryMetricsAtThreshold,
  generateSyntheticDuplicateDataset,
  trainDefaultDuplicateClassifierModel,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

describe('duplicate classifier model gate', () => {
  it('meets >=0.99 holdout precision on diverse synthetic data', () => {
    const { holdout } = generateSyntheticDuplicateDataset(42026, 2400, 0.2);
    const metrics = binaryMetricsAtThreshold(
      holdout,
      DEFAULT_DUPLICATE_CLASSIFIER_MODEL.weights,
      DEFAULT_DUPLICATE_CLASSIFIER_MODEL.autoStackThreshold
    );

    expect(metrics.precision).toBeGreaterThanOrEqual(0.99);
    expect(metrics.recall).toBeGreaterThan(0.5);
  });

  it('re-trains with stable precision on a fresh synthetic split', () => {
    const model = trainDefaultDuplicateClassifierModel(99_001);
    expect(model.training.holdoutPrecision).toBeGreaterThanOrEqual(0.99);
    expect(model.training.holdoutRecall).toBeGreaterThan(0.5);
  });
});
