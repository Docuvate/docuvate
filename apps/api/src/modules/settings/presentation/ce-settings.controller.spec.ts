// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { CeSettingsController } from './ce-settings.controller.js';

describe('CeSettingsController', () => {
  afterEach(() => {
    delete process.env.DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE;
    delete process.env.DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS;
    delete process.env.DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS;
  });

  it('returns installation CE flags from env', () => {
    process.env.DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS = 'true';
    const controller = new CeSettingsController();
    expect(controller.getCeFeatureFlags()).toEqual({
      layoutReconstructionCompare: false,
      sourceConnectors: true,
      experimentalResearchModels: false,
    });
  });
});
