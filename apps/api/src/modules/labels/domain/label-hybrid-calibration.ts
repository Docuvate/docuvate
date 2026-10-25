// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './cosine.js';
import {
  LABEL_HYBRID_K_FOLD_COUNT,
  LABEL_HYBRID_LOO_MAX_EXAMPLES,
} from './label-hybrid-training-config.js';

const MIN_CLASS_EXAMPLES = 2;
const MIN_TRAINED_CLASSES = 2;
const LOO_TARGET_PRECISION = 0.95;
const TRAIN_EPOCHS = 48;
const TRAIN_LR = 0.08;
const L2 = 1e-4;
const IN_DISTRIBUTION_COSINE_QUANTILE = 0.1;

export interface PreparedTrainingExamplePayload {
  tagId: string;
  embedding: number[];
  text: string;
  features: number[];
}

export interface LooCalibrationScore {
  confidence: number;
  correct: boolean;
}

export interface LooBatchWorkerInput {
  tagIds: string[];
  prepared: PreparedTrainingExamplePayload[];
  holdIndices: number[];
}

interface ClassGate {
  tagId: string;
  minCosineToCentroid: number;
  centroid: number[];
}

interface TrainingExampleSlice {
  tagId: string;
  embedding: number[];
  text: string;
}

function softmaxInto(logits: Float64Array, out: Float64Array): void {
  let max = logits[0];
  for (let i = 1; i < logits.length; i++) {
    if (logits[i] > max) {
      max = logits[i];
    }
  }
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] - max);
    out[i] = e;
    sum += e;
  }
  const denom = sum > 0 ? sum : 1;
  for (let i = 0; i < out.length; i++) {
    out[i] /= denom;
  }
}

function trainMultinomialLogistic(
  classCount: number,
  rows: readonly { features: Float64Array; classIndex: number }[],
  dim: number
): number[][] {
  const weights: Float64Array[] = Array.from(
    { length: classCount },
    () => new Float64Array(dim)
  );
  const logits = new Float64Array(classCount);
  const probs = new Float64Array(classCount);
  for (let epoch = 0; epoch < TRAIN_EPOCHS; epoch++) {
    for (const row of rows) {
      const features = row.features;
      for (let c = 0; c < classCount; c++) {
        const w = weights[c];
        let dot = 0;
        for (let j = 0; j < dim; j++) {
          dot += w[j] * features[j];
        }
        logits[c] = dot;
      }
      softmaxInto(logits, probs);
      for (let c = 0; c < classCount; c++) {
        const target = c === row.classIndex ? 1 : 0;
        const err = probs[c] - target;
        const w = weights[c];
        for (let j = 0; j < dim; j++) {
          w[j] -= TRAIN_LR * (err * features[j] + L2 * w[j]);
        }
      }
    }
  }
  return weights.map((w) => [...w]);
}

function predictProbsFromFeatures(
  weightRows: readonly number[][],
  features: Float64Array
): number[] {
  const logits = new Float64Array(weightRows.length);
  for (let c = 0; c < weightRows.length; c++) {
    const w = weightRows[c];
    let dot = 0;
    for (let j = 0; j < features.length; j++) {
      dot += w[j] * features[j];
    }
    logits[c] = dot;
  }
  const probs = new Float64Array(weightRows.length);
  softmaxInto(logits, probs);
  return [...probs];
}

function l2Normalize(values: number[]): number[] {
  let sum = 0;
  for (const v of values) {
    sum += v * v;
  }
  const norm = Math.sqrt(sum);
  if (norm <= 1e-12) {
    return values.map(() => 0);
  }
  return values.map((v) => v / norm);
}

function buildClassGates(
  examples: readonly TrainingExampleSlice[],
  tagIds: readonly string[]
): ClassGate[] {
  const tagIdSet = new Set(tagIds);
  const sums = new Map<string, number[]>();
  const counts = new Map<string, number>();
  const cosinesByTag = new Map<string, number[]>();

  for (const row of examples) {
    if (!tagIdSet.has(row.tagId) || row.embedding.length === 0) {
      continue;
    }
    const prev = sums.get(row.tagId);
    if (!prev) {
      sums.set(row.tagId, [...row.embedding]);
      counts.set(row.tagId, 1);
      cosinesByTag.set(row.tagId, []);
      continue;
    }
    for (let i = 0; i < prev.length; i++) {
      prev[i] += row.embedding[i];
    }
    counts.set(row.tagId, (counts.get(row.tagId) ?? 0) + 1);
  }

  const gates: ClassGate[] = [];
  for (const tagId of tagIds) {
    const sum = sums.get(tagId);
    const count = counts.get(tagId) ?? 0;
    if (!sum || count === 0) {
      continue;
    }
    const centroid = l2Normalize(sum.map((v) => v / count));
    const cosines = cosinesByTag.get(tagId) ?? [];
    for (const row of examples) {
      if (row.tagId !== tagId) {
        continue;
      }
      cosines.push(cosineSimilarity(row.embedding, centroid));
    }
    cosines.sort((a, b) => a - b);
    const idx = Math.max(
      0,
      Math.min(cosines.length - 1, Math.floor(IN_DISTRIBUTION_COSINE_QUANTILE * cosines.length))
    );
    gates.push({
      tagId,
      centroid,
      minCosineToCentroid: cosines[idx] ?? 0,
    });
  }
  return gates;
}

function activeTagsForTrain(
  tagIds: readonly string[],
  train: readonly PreparedTrainingExamplePayload[]
): string[] {
  const counts = new Map<string, number>();
  for (const row of train) {
    counts.set(row.tagId, (counts.get(row.tagId) ?? 0) + 1);
  }
  return tagIds.filter((tagId) => (counts.get(tagId) ?? 0) >= MIN_CLASS_EXAMPLES);
}

function toPreparedPayload(
  prepared: readonly {
    tagId: string;
    embedding: number[];
    text: string;
    features: Float64Array;
  }[]
): PreparedTrainingExamplePayload[] {
  return prepared.map((row) => ({
    tagId: row.tagId,
    embedding: row.embedding,
    text: row.text,
    features: [...row.features],
  }));
}

function evaluateLooFoldHold(
  hold: number,
  tagIds: readonly string[],
  prepared: readonly PreparedTrainingExamplePayload[]
): LooCalibrationScore | null {
  const held = prepared[hold];
  const train: PreparedTrainingExamplePayload[] = [];
  for (let idx = 0; idx < prepared.length; idx++) {
    if (idx !== hold) {
      train.push(prepared[idx]);
    }
  }
  const activeTags = activeTagsForTrain(tagIds, train);
  if (activeTags.length < MIN_TRAINED_CLASSES) {
    return null;
  }
  const tagIdSet = new Set(tagIds);
  const activeTagIndex = new Map<string, number>();
  for (let i = 0; i < activeTags.length; i++) {
    activeTagIndex.set(activeTags[i], i);
  }
  const rows: { features: Float64Array; classIndex: number }[] = [];
  for (const row of train) {
    if (!tagIdSet.has(row.tagId)) {
      continue;
    }
    const classIndex = activeTagIndex.get(row.tagId);
    if (classIndex === undefined) {
      continue;
    }
    rows.push({ features: Float64Array.from(row.features), classIndex });
  }
  if (rows.length === 0) {
    return null;
  }
  const dim = rows[0].features.length;
  const weightRows = trainMultinomialLogistic(activeTags.length, rows, dim);
  const trainExamples: TrainingExampleSlice[] = train.map((row) => ({
    tagId: row.tagId,
    embedding: row.embedding,
    text: row.text,
  }));
  const classGates = buildClassGates(trainExamples, activeTags);
  const heldFeatures = Float64Array.from(held.features);
  const probs = predictProbsFromFeatures(weightRows, heldFeatures);
  let bestIdx = 0;
  let bestProb = probs[0] ?? 0;
  for (let i = 1; i < probs.length; i++) {
    const p = probs[i] ?? 0;
    if (p > bestProb) {
      bestProb = p;
      bestIdx = i;
    }
  }
  const predicted = activeTags[bestIdx];
  let gate: ClassGate | undefined;
  for (const g of classGates) {
    if (g.tagId === predicted) {
      gate = g;
      break;
    }
  }
  const inDist =
    gate?.centroid.length === held.embedding.length
      ? cosineSimilarity(held.embedding, gate.centroid) >= gate.minCosineToCentroid
      : true;
  if (!inDist) {
    return null;
  }
  return {
    confidence: bestProb,
    correct: predicted === held.tagId,
  };
}

export function evaluateLooFoldsBatch(input: LooBatchWorkerInput): LooCalibrationScore[] {
  const out: LooCalibrationScore[] = [];
  for (const hold of input.holdIndices) {
    const score = evaluateLooFoldHold(hold, input.tagIds, input.prepared);
    if (score) {
      out.push(score);
    }
  }
  return out;
}

export function thresholdFromLooScores(looScores: readonly LooCalibrationScore[]): number {
  if (looScores.length === 0) {
    return 0.92;
  }
  const sorted = [...looScores].sort((a, b) => b.confidence - a.confidence);
  let correct = 0;
  let total = 0;
  let threshold = 0.99;
  for (const row of sorted) {
    total += 1;
    if (row.correct) {
      correct += 1;
    }
    const precision = correct / total;
    if (precision >= LOO_TARGET_PRECISION) {
      threshold = row.confidence;
    }
  }
  return Math.min(0.99, Math.max(0.55, threshold));
}

function buildKFoldPartitions(exampleCount: number, foldCount: number): number[][] {
  const folds: number[][] = Array.from({ length: foldCount }, () => []);
  for (let index = 0; index < exampleCount; index += 1) {
    folds[index % foldCount].push(index);
  }
  return folds.filter((fold) => fold.length > 0);
}

function scoreCalibrationFold(
  tagIds: readonly string[],
  prepared: readonly PreparedTrainingExamplePayload[],
  trainIndices: readonly number[],
  testIndices: readonly number[]
): LooCalibrationScore[] {
  const train = trainIndices.map((index) => prepared[index]);
  const activeTags = activeTagsForTrain(tagIds, train);
  if (activeTags.length < MIN_TRAINED_CLASSES) {
    return [];
  }
  const tagIdSet = new Set(tagIds);
  const activeTagIndex = new Map<string, number>();
  for (let i = 0; i < activeTags.length; i += 1) {
    activeTagIndex.set(activeTags[i], i);
  }
  const rows: { features: Float64Array; classIndex: number }[] = [];
  for (const row of train) {
    if (!tagIdSet.has(row.tagId)) {
      continue;
    }
    const classIndex = activeTagIndex.get(row.tagId);
    if (classIndex === undefined) {
      continue;
    }
    rows.push({ features: Float64Array.from(row.features), classIndex });
  }
  if (rows.length === 0) {
    return [];
  }
  const dim = rows[0].features.length;
  const weightRows = trainMultinomialLogistic(activeTags.length, rows, dim);
  const trainExamples: TrainingExampleSlice[] = train.map((row) => ({
    tagId: row.tagId,
    embedding: row.embedding,
    text: row.text,
  }));
  const classGates = buildClassGates(trainExamples, activeTags);
  const out: LooCalibrationScore[] = [];
  for (const testIndex of testIndices) {
    const held = prepared[testIndex];
    const heldFeatures = Float64Array.from(held.features);
    const probs = predictProbsFromFeatures(weightRows, heldFeatures);
    let bestIdx = 0;
    let bestProb = probs[0] ?? 0;
    for (let i = 1; i < probs.length; i += 1) {
      const p = probs[i] ?? 0;
      if (p > bestProb) {
        bestProb = p;
        bestIdx = i;
      }
    }
    const predicted = activeTags[bestIdx];
    let gate: ClassGate | undefined;
    for (const g of classGates) {
      if (g.tagId === predicted) {
        gate = g;
        break;
      }
    }
    const inDist =
      gate?.centroid.length === held.embedding.length
        ? cosineSimilarity(held.embedding, gate.centroid) >= gate.minCosineToCentroid
        : true;
    if (!inDist) {
      continue;
    }
    out.push({
      confidence: bestProb,
      correct: predicted === held.tagId,
    });
  }
  return out;
}

export function learnConfidenceThresholdLoo(
  tagIds: readonly string[],
  prepared: readonly PreparedTrainingExamplePayload[]
): number {
  const holdIndices = prepared.map((_, index) => index);
  if (holdIndices.length === 0) {
    return 0.92;
  }
  const looScores = evaluateLooFoldsBatch({
    tagIds: [...tagIds],
    prepared: [...prepared],
    holdIndices,
  });
  return thresholdFromLooScores(looScores);
}

/**
 * K-fold cross-conformal calibration (marginal coverage at target precision on calibration fold).
 * Used above {@link LABEL_HYBRID_LOO_MAX_EXAMPLES} for bounded CPU; exact LOO below that size.
 */
export function learnConfidenceThresholdKFold(
  tagIds: readonly string[],
  prepared: readonly PreparedTrainingExamplePayload[],
  foldCount: number
): number {
  if (prepared.length === 0) {
    return 0.92;
  }
  const folds = buildKFoldPartitions(prepared.length, foldCount);
  const scores: LooCalibrationScore[] = [];
  for (const testIndices of folds) {
    const testSet = new Set(testIndices);
    const trainIndices: number[] = [];
    for (let index = 0; index < prepared.length; index += 1) {
      if (!testSet.has(index)) {
        trainIndices.push(index);
      }
    }
    scores.push(...scoreCalibrationFold(tagIds, prepared, trainIndices, testIndices));
  }
  return thresholdFromLooScores(scores);
}

export function learnConfidenceThresholdFromPrepared(
  tagIds: readonly string[],
  prepared: readonly {
    tagId: string;
    embedding: number[];
    text: string;
    features: Float64Array;
  }[]
): number {
  const payload = toPreparedPayload(prepared);
  if (payload.length === 0) {
    return 0.92;
  }
  if (payload.length <= LABEL_HYBRID_LOO_MAX_EXAMPLES) {
    return learnConfidenceThresholdLoo(tagIds, payload);
  }
  return learnConfidenceThresholdKFold(tagIds, payload, LABEL_HYBRID_K_FOLD_COUNT);
}
