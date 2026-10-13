// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { readFeatureFlagDefaultsFromEnv } from './read-feature-flag-defaults.js';

describe('readFeatureFlagDefaultsFromEnv', () => {
  const originalLayout = process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'];
  const originalSource = process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'];
  const originalResearch = process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'];

  afterEach(() => {
    if (originalLayout === undefined) {
      process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = undefined;
    } else {
      process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = originalLayout;
    }
    if (originalSource === undefined) {
      process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    } else {
      process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = originalSource;
    }
    if (originalResearch === undefined) {
      process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = undefined;
    } else {
      process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = originalResearch;
    }
  });

  it('defaults all flags to false when env is unset', () => {
    process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = undefined;
    process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = undefined;
    expect(readFeatureFlagDefaultsFromEnv()).toEqual({
      layoutReconstructionCompare: false,
      sourceConnectors: false,
      experimentalResearchModels: false,
    });
  });

  it('parses true-like env values', () => {
    process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = 'true';
    process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = '1';
    process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = 'yes';
    expect(readFeatureFlagDefaultsFromEnv()).toEqual({
      layoutReconstructionCompare: true,
      sourceConnectors: true,
      experimentalResearchModels: true,
    });
  });
});
