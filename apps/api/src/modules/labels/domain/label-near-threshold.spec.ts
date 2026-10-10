// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  adjustLabelNearThresholdFromFeedback,
  clampLabelNearThreshold,
  DEFAULT_LABEL_NEAR_SIMILARITY_THRESHOLD,
} from './label-near-threshold.js';

describe('label-near-threshold', () => {
  it('uses 0.62 as default', () => {
    expect(DEFAULT_LABEL_NEAR_SIMILARITY_THRESHOLD).toBe(0.62);
  });

  it('raises threshold after dismiss', () => {
    const next = adjustLabelNearThresholdFromFeedback(0.62, 0.65, 'dismiss');
    expect(next).toBeGreaterThan(0.62);
  });

  it('may lower threshold after accept', () => {
    const next = adjustLabelNearThresholdFromFeedback(0.62, 0.7, 'accept');
    expect(next).toBeLessThanOrEqual(0.62);
  });

  it('clamps to bounds', () => {
    expect(clampLabelNearThreshold(0.2)).toBe(0.5);
    expect(clampLabelNearThreshold(0.99)).toBe(0.92);
  });
});
