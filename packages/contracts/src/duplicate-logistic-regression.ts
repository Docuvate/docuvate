// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { DuplicateFeatureVector } from './duplicate-content-compare.js';

export const DUPLICATE_FEATURE_ORDER: readonly (keyof DuplicateFeatureVector)[] = [
  'embeddingSimilarity',
  'fractionDifferingTokens',
  'fractionDifferingValueTokens',
  'relativePageCountDiff',
  'perceptualPageHashDistance',
  'shingleJaccardDistance',
];

export interface DuplicateTrainingSample {
  features: DuplicateFeatureVector;
  label: 0 | 1;
}

export interface DuplicateClassifierModel {
  version: 1;
  weights: number[];
  autoStackThreshold: number;
  suggestThreshold: number;
  training: {
    seed: number;
    trainCount: number;
    holdoutCount: number;
    holdoutPrecision: number;
    holdoutRecall: number;
    holdoutF1: number;
  };
}

export function featureVectorToArray(features: DuplicateFeatureVector): number[] {
  return DUPLICATE_FEATURE_ORDER.map((key) => features[key]);
}

export function sigmoid(z: number): number {
  if (z >= 0) {
    const exp = Math.exp(-z);
    return 1 / (1 + exp);
  }
  const exp = Math.exp(z);
  return exp / (1 + exp);
}

export function predictLogit(weights: number[], features: number[]): number {
  let z = weights[0];
  for (let i = 0; i < features.length; i += 1) {
    z += weights[i + 1] * features[i];
  }
  return z;
}

export function predictProbability(weights: number[], features: DuplicateFeatureVector): number {
  return sigmoid(predictLogit(weights, featureVectorToArray(features)));
}

export function trainLogisticRegression(
  samples: DuplicateTrainingSample[],
  options?: { learningRate?: number; epochs?: number; l2?: number }
): number[] {
  const learningRate = options?.learningRate ?? 0.08;
  const epochs = options?.epochs ?? 450;
  const l2 = options?.l2 ?? 0.02;
  const dim = DUPLICATE_FEATURE_ORDER.length;
  const weights = new Array<number>(dim + 1).fill(0);

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const grads = new Array<number>(dim + 1).fill(0);
    for (const sample of samples) {
      const x = featureVectorToArray(sample.features);
      const p = sigmoid(predictLogit(weights, x));
      const error = p - sample.label;
      grads[0] += error;
      for (let i = 0; i < dim; i += 1) {
        grads[i + 1] += error * x[i];
      }
    }
    const n = samples.length;
    for (let i = 0; i < weights.length; i += 1) {
      const reg = i === 0 ? 0 : l2 * weights[i];
      weights[i] -= (learningRate * grads[i]) / n + learningRate * reg;
    }
  }
  return weights;
}

export interface BinaryMetrics {
  precision: number;
  recall: number;
  f1: number;
}

export function binaryMetricsAtThreshold(
  samples: DuplicateTrainingSample[],
  weights: number[],
  threshold: number
): BinaryMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (const sample of samples) {
    const p = predictProbability(weights, sample.features);
    const pred = p >= threshold;
    if (pred && sample.label === 1) tp += 1;
    else if (pred && sample.label === 0) fp += 1;
    else if (!pred && sample.label === 1) fn += 1;
  }
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1 };
}

export function calibrateThresholdForPrecision(
  samples: DuplicateTrainingSample[],
  weights: number[],
  minPrecision: number
): { threshold: number; metrics: BinaryMetrics } {
  const scores = samples
    .map((sample) => ({
      label: sample.label,
      p: predictProbability(weights, sample.features),
    }))
    .sort((a, b) => b.p - a.p);

  let bestThreshold = 1;
  let bestMetrics: BinaryMetrics = { precision: 1, recall: 0, f1: 0 };

  for (let i = 0; i < scores.length; i += 1) {
    const threshold = i === 0 ? 1 : scores[i - 1].p;
    const predicted = scores.map((s) => (s.p >= threshold ? 1 : 0));
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (let j = 0; j < scores.length; j += 1) {
      const label = scores[j].label;
      const pred = predicted[j];
      if (pred === 1 && label === 1) tp += 1;
      else if (pred === 1 && label === 0) fp += 1;
      else if (pred === 0 && label === 1) fn += 1;
    }
    const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    if (precision + 1e-9 >= minPrecision && recall >= bestMetrics.recall) {
      bestThreshold = threshold;
      bestMetrics = { precision, recall, f1 };
    }
  }

  return { threshold: Math.min(0.999, Math.max(0.5, bestThreshold)), metrics: bestMetrics };
}

export function fitUserLogitInterceptDelta(
  samples: DuplicateTrainingSample[],
  baseWeights: number[]
): number {
  if (samples.length === 0) return 0;
  let delta = 0;
  for (let step = 0; step < 80; step += 1) {
    let grad = 0;
    for (const sample of samples) {
      const x = featureVectorToArray(sample.features);
      const z = predictLogit(baseWeights, x) + delta;
      const p = sigmoid(z);
      grad += p - sample.label;
    }
    delta -= (0.15 * grad) / samples.length;
  }
  return delta;
}
