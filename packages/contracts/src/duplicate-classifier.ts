// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { DuplicateFeatureVector } from './duplicate-content-compare.js';
import {
  calibrateThresholdForPrecision,
  featureVectorToArray,
  predictLogit,
  trainLogisticRegression,
  type DuplicateClassifierModel,
  type DuplicateTrainingSample,
} from './duplicate-logistic-regression.js';
import { generateSyntheticDuplicateDataset } from './duplicate-synthetic-data.js';

export type DuplicatePairDecision = 'auto_stack' | 'suggest' | 'ignore';

export function trainDefaultDuplicateClassifierModel(seed = 42_026): DuplicateClassifierModel {
  const { train, holdout } = generateSyntheticDuplicateDataset(seed, 2400, 0.2);
  const weights = trainLogisticRegression(train);
  const auto = calibrateThresholdForPrecision(holdout, weights, 0.99);
  const suggest = calibrateThresholdForPrecision(holdout, weights, 0.88);

  return {
    version: 1,
    weights,
    autoStackThreshold: auto.threshold,
    suggestThreshold: Math.min(auto.threshold - 0.05, suggest.threshold),
    training: {
      seed,
      trainCount: train.length,
      holdoutCount: holdout.length,
      holdoutPrecision: auto.metrics.precision,
      holdoutRecall: auto.metrics.recall,
      holdoutF1: auto.metrics.f1,
    },
  };
}

export function decideDuplicatePair(
  model: DuplicateClassifierModel,
  features: DuplicateFeatureVector,
  userLogitInterceptDelta = 0
): { decision: DuplicatePairDecision; probability: number } {
  const z = predictLogit(model.weights, featureVectorToArray(features));
  const probability = 1 / (1 + Math.exp(-(z + userLogitInterceptDelta)));

  if (probability >= model.autoStackThreshold) {
    return { decision: 'auto_stack', probability };
  }
  if (probability >= model.suggestThreshold) {
    return { decision: 'suggest', probability };
  }
  return { decision: 'ignore', probability };
}

export function evaluateModelOnSamples(
  model: DuplicateClassifierModel,
  samples: DuplicateTrainingSample[]
): { precision: number; recall: number; f1: number } {
  const auto = calibrateThresholdForPrecision(samples, model.weights, 0.99);
  return auto.metrics;
}
