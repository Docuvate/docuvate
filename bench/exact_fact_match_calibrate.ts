#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Replay C5 decoy calibration and print the default Fellegi–Sunter match gate.
 *
 *   pnpm exec tsx bench/exact_fact_match_calibrate.ts
 */
import {
  EXACT_FACT_MATCH_C5_SAMPLES,
  EXACT_FACT_MATCH_CALIBRATION,
  EXACT_FACT_MATCH_PRIOR_STRICT_THRESHOLD,
  calibrateExactFactMatchThreshold,
  estimateFellegiSunterWeights,
  exactFactMatchScoreTokens,
  fellegiSunterExactFactMatchScore,
} from '@docuvate/contracts';

function scoreSample(
  sample: (typeof EXACT_FACT_MATCH_C5_SAMPLES)[number],
  weights: ReturnType<typeof estimateFellegiSunterWeights>
): number {
  const tokens = exactFactMatchScoreTokens(sample.queryTokens, null);
  return fellegiSunterExactFactMatchScore(
    tokens,
    sample.predicateKey,
    sample.valueText,
    weights
  );
}

const weights = estimateFellegiSunterWeights(EXACT_FACT_MATCH_C5_SAMPLES);
const calibrated = calibrateExactFactMatchThreshold(
  EXACT_FACT_MATCH_C5_SAMPLES.map((sample) => ({
    ...sample,
    queryTokens: exactFactMatchScoreTokens(sample.queryTokens, null),
  })),
  weights
);

console.log(
  JSON.stringify(
    {
      weights,
      priorStrictThreshold: EXACT_FACT_MATCH_PRIOR_STRICT_THRESHOLD,
      calibratedThreshold: calibrated.threshold,
      matchRecall: calibrated.matchRecall,
      decoyPrecision: calibrated.decoyPrecision,
      shippedDefault: EXACT_FACT_MATCH_CALIBRATION.defaultMatchScoreThreshold,
      sampleScores: EXACT_FACT_MATCH_C5_SAMPLES.map((sample) => ({
        id: sample.id,
        label: sample.label,
        score: scoreSample(sample, weights),
      })),
    },
    null,
    2
  )
);
