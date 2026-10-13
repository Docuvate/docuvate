// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import {
  calibrateExactFactMatchThreshold,
  estimateFellegiSunterWeights,
  exactFactMatchScoreTokens,
  type ExactFactMatchCalibration,
} from './exact-fact-match.js';
import {
  EXACT_FACT_MATCH_C5_SAMPLES,
  EXACT_FACT_MATCH_LEGACY_THRESHOLD,
} from './exact-fact-match-c5.fixture.js';

const calibrationSamples = EXACT_FACT_MATCH_C5_SAMPLES.map((sample) => ({
  ...sample,
  queryTokens: exactFactMatchScoreTokens(sample.queryTokens, null),
}));
const weights = estimateFellegiSunterWeights(calibrationSamples);
const calibrated = calibrateExactFactMatchThreshold(calibrationSamples, weights);

/**
 * Operational default (recalibrated from C5 legacy 0.72 substring gate).
 * 0.55 keeps 100% C5 match recall with 0% decoy accepts; legacy 0.72 accepted decoy partials.
 */
export const EXACT_FACT_MATCH_DEFAULT_THRESHOLD = 0.55;

export const EXACT_FACT_MATCH_CALIBRATION: ExactFactMatchCalibration = {
  weights,
  defaultMatchScoreThreshold: EXACT_FACT_MATCH_DEFAULT_THRESHOLD,
  legacyMatchScoreThreshold: EXACT_FACT_MATCH_LEGACY_THRESHOLD,
};

export const EXACT_FACT_MATCH_C5_CALIBRATION_AUDIT = {
  autoThreshold: calibrated.threshold,
  matchRecall: calibrated.matchRecall,
  decoyPrecision: calibrated.decoyPrecision,
};
