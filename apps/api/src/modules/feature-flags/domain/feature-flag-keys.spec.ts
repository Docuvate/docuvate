// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { FEATURE_FLAG_DB_KEYS, mergeFeatureFlags } from './feature-flag-keys.js';

describe('mergeFeatureFlags', () => {
  const defaults = {
    layoutReconstructionCompare: false,
    sourceConnectors: false,
    experimentalResearchModels: false,
  };

  it('uses tenant override when present', () => {
    const overrides = new Map([[FEATURE_FLAG_DB_KEYS.sourceConnectors, true]]);
    expect(mergeFeatureFlags(defaults, overrides)).toEqual({
      layoutReconstructionCompare: false,
      sourceConnectors: true,
      experimentalResearchModels: false,
    });
  });

  it('falls back to defaults for missing overrides', () => {
    expect(mergeFeatureFlags({ ...defaults, layoutReconstructionCompare: true }, new Map())).toEqual(
      {
        layoutReconstructionCompare: true,
        sourceConnectors: false,
        experimentalResearchModels: false,
      }
    );
  });
});
