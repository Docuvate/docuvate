// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { FEATURE_FLAG_DB_KEYS, mergeFeatureFlags } from './feature-flag-keys.js';

describe('mergeFeatureFlags', () => {
  const defaults = {
    layoutReconstructionCompare: false,
    sourceConnectors: false,
    experimentalResearchModels: false,
    exactAnswers: false,
    smartDuplicates: false,
    answerAbstention: false,
    learnedValueTypes: false,
    layoutKeyValueRoles: false,
    localChatModel: false,
  };

  it('uses tenant override when present', () => {
    const overrides = new Map([[FEATURE_FLAG_DB_KEYS.sourceConnectors, true]]);
    expect(mergeFeatureFlags(defaults, overrides)).toEqual({
      ...defaults,
      sourceConnectors: true,
    });
  });

  it('merges ML feature overrides', () => {
    const overrides = new Map([
      [FEATURE_FLAG_DB_KEYS.exactAnswers, true],
      [FEATURE_FLAG_DB_KEYS.localChatModel, true],
    ]);
    expect(mergeFeatureFlags(defaults, overrides)).toEqual({
      ...defaults,
      exactAnswers: true,
      localChatModel: true,
    });
  });

  it('falls back to defaults for missing overrides', () => {
    expect(mergeFeatureFlags({ ...defaults, layoutReconstructionCompare: true }, new Map())).toEqual(
      {
        ...defaults,
        layoutReconstructionCompare: true,
      }
    );
  });
});
