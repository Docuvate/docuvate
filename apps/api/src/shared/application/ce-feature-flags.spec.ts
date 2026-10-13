// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { readCeFeatureFlagsFromEnv } from './ce-feature-flags.js';

describe('readCeFeatureFlagsFromEnv', () => {
  const originalLayout = process.env['DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'];
  const originalSource = process.env['DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'];
  const originalResearch = process.env['DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'];

  afterEach(() => {
    if (originalLayout === undefined) {
      process.env['DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = undefined;
    } else {
      process.env['DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = originalLayout;
    }
    if (originalSource === undefined) {
      process.env['DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    } else {
      process.env['DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'] = originalSource;
    }
    if (originalResearch === undefined) {
      process.env['DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = undefined;
    } else {
      process.env['DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = originalResearch;
    }
  });

  it('defaults all flags to false', () => {
    process.env['DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = undefined;
    process.env['DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    process.env['DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = undefined;
    expect(readCeFeatureFlagsFromEnv()).toEqual({
      layoutReconstructionCompare: false,
      sourceConnectors: false,
      experimentalResearchModels: false,
    });
  });

  it('enables flags only for true/1/yes', () => {
    process.env['DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = 'true';
    process.env['DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'] = '1';
    process.env['DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = 'yes';
    expect(readCeFeatureFlagsFromEnv()).toEqual({
      layoutReconstructionCompare: true,
      sourceConnectors: true,
      experimentalResearchModels: true,
    });
  });
});
