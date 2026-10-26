// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './cosine.js';
import {
  learnConfidenceThresholdFromPrepared,
  type PreparedTrainingExamplePayload,
} from './label-hybrid-calibration.js';
import {
  LABEL_HYBRID_FAST_DEFAULT_THRESHOLD,
  labelHybridTrainEpochsForExampleCount,
  type LabelHybridTrainRuntimeOptions,
} from './label-hybrid-training-config.js';
import {
  buildHybridFeatureModel,
  hybridFeatureVector,
  l2Normalize,
} from './label-hybrid-features.js';

const MIN_CLASS_EXAMPLES = 2;
const MIN_TRAINED_CLASSES = 2;
const TRAIN_LR = 0.08;
const L2 = 1e-4;
const IN_DISTRIBUTION_COSINE_QUANTILE = 0.1;

export interface LabelHybridTrainingExample {
  embedding: number[];
  text: string;
  tagId: string;
}

export interface LabelHybridClassGate {
  tagId: string;
  minCosineToCentroid: number;
  centroid: number[];
}

export interface LabelHybridModel {
  tagIds: string[];
  vocabulary: string[];
  idf: number[];
  /** One row per class: [bias, tfidf..., weighted embedding...] */
  weightRows: number[][];
  embedDim: number;
  confidenceThreshold: number;
  classGates: LabelHybridClassGate[];
}

export interface LabelHybridPrediction {
  tagId: string | null;
  confidence: number;
  inDistribution: boolean;
  ranked: { tagId: string; confidence: number }[];
}

interface PreparedTrainingExample {
  tagId: string;
  embedding: number[];
  text: string;
  features: Float64Array;
}

function featureVector(
  embedding: number[],
  text: string,
  vocabulary: readonly string[],
  idf: readonly number[]
): Float64Array {
  const dense = hybridFeatureVector(embedding, text, { vocabulary: [...vocabulary], idf: [...idf] });
  return Float64Array.from(dense);
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
  dim: number,
  epochCount: number,
  shouldAbort?: () => boolean
): number[][] {
  const weights: Float64Array[] = Array.from(
    { length: classCount },
    () => new Float64Array(dim)
  );
  const logits = new Float64Array(classCount);
  const probs = new Float64Array(classCount);
  const epochs = Math.max(1, epochCount);
  for (let epoch = 0; epoch < epochs; epoch++) {
    if (shouldAbort?.()) {
      break;
    }
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

function predictProbs(model: LabelHybridModel, embedding: number[], text: string): number[] {
  const x = featureVector(embedding, text, model.vocabulary, model.idf);
  return predictProbsFromFeatures(model.weightRows, x);
}

function buildClassGates(
  examples: readonly LabelHybridTrainingExample[],
  tagIds: readonly string[]
): LabelHybridClassGate[] {
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

  const gates: LabelHybridClassGate[] = [];
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

function examplesPerClass(examples: readonly LabelHybridTrainingExample[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of examples) {
    counts.set(row.tagId, (counts.get(row.tagId) ?? 0) + 1);
  }
  return counts;
}

function prepareTrainingExamples(
  examples: readonly LabelHybridTrainingExample[],
  vocabulary: readonly string[],
  idf: readonly number[]
): PreparedTrainingExample[] {
  return examples.map((row) => ({
    tagId: row.tagId,
    embedding: row.embedding,
    text: row.text,
    features: featureVector(row.embedding, row.text, vocabulary, idf),
  }));
}

export function canTrainLabelHybridModel(examples: readonly LabelHybridTrainingExample[]): boolean {
  const counts = examplesPerClass(examples);
  const eligible = [...counts.values()].filter((c) => c >= MIN_CLASS_EXAMPLES).length;
  return eligible >= MIN_TRAINED_CLASSES;
}

/** Feature payloads for calibration benchmarks (synthetic / public fixtures only). */
export function buildLabelHybridCalibrationPayload(
  examples: readonly LabelHybridTrainingExample[]
): { tagIds: string[]; prepared: PreparedTrainingExamplePayload[] } | null {
  if (!canTrainLabelHybridModel(examples)) {
    return null;
  }
  const counts = examplesPerClass(examples);
  const tagIds = [...counts.entries()]
    .filter(([, count]) => count >= MIN_CLASS_EXAMPLES)
    .map(([tagId]) => tagId)
    .sort();
  if (tagIds.length < MIN_TRAINED_CLASSES) {
    return null;
  }
  const corpus = examples.map((row) => ({ text: row.text }));
  const featureModel = buildHybridFeatureModel(corpus);
  const prepared = prepareTrainingExamples(examples, featureModel.vocabulary, featureModel.idf).map(
    (row) => ({
      tagId: row.tagId,
      embedding: row.embedding,
      text: row.text,
      features: [...row.features],
    })
  );
  return { tagIds, prepared };
}

export function trainLabelHybridModel(
  examples: readonly LabelHybridTrainingExample[],
  vocabRows?: readonly { text: string }[],
  options?: LabelHybridTrainRuntimeOptions
): LabelHybridModel | null {
  if (!canTrainLabelHybridModel(examples)) {
    return null;
  }
  const counts = examplesPerClass(examples);
  const tagIds = [...counts.entries()]
    .filter(([, count]) => count >= MIN_CLASS_EXAMPLES)
    .map(([tagId]) => tagId)
    .sort();
  if (tagIds.length < MIN_TRAINED_CLASSES) {
    return null;
  }
  const corpus = (vocabRows ?? examples).map((row) => ({ text: row.text }));
  const featureModel = buildHybridFeatureModel(corpus);
  const vocabulary = featureModel.vocabulary;
  const idf = featureModel.idf;
  const prepared = prepareTrainingExamples(examples, vocabulary, idf);
  const tagIdSet = new Set(tagIds);
  const tagIdToIndex = new Map<string, number>();
  for (let i = 0; i < tagIds.length; i++) {
    tagIdToIndex.set(tagIds[i], i);
  }
  const rows: { features: Float64Array; classIndex: number }[] = [];
  for (const row of prepared) {
    if (!tagIdSet.has(row.tagId)) {
      continue;
    }
    const classIndex = tagIdToIndex.get(row.tagId);
    if (classIndex === undefined) {
      continue;
    }
    rows.push({ features: row.features, classIndex });
  }
  const dim = rows[0]?.features.length ?? 0;
  const epochCount = labelHybridTrainEpochsForExampleCount(rows.length);
  const weightRows = trainMultinomialLogistic(
    tagIds.length,
    rows,
    dim,
    epochCount,
    options?.shouldAbort
  );
  const embedDim = examples.find((row) => row.embedding.length > 0)?.embedding.length ?? 0;
  const classGates = buildClassGates(examples, tagIds);
  const aborted = options?.shouldAbort?.() ?? false;
  const confidenceThreshold =
    options?.fastCalibration || aborted
      ? LABEL_HYBRID_FAST_DEFAULT_THRESHOLD
      : learnConfidenceThresholdFromPrepared(tagIds, prepared);
  return {
    tagIds,
    vocabulary,
    idf,
    weightRows,
    embedDim,
    confidenceThreshold,
    classGates,
  };
}

export function predictLabelHybrid(
  model: LabelHybridModel,
  embedding: number[],
  text: string
): LabelHybridPrediction {
  if (embedding.length === 0 || model.tagIds.length === 0) {
    return { tagId: null, confidence: 0, inDistribution: false, ranked: [] };
  }
  const probs = predictProbs(model, embedding, text);
  const ranked = model.tagIds
    .map((tagId, idx) => ({ tagId, confidence: probs[idx] ?? 0 }))
    .sort((a, b) => b.confidence - a.confidence);
  const best = ranked[0];
  const gate = model.classGates.find((row) => row.tagId === best.tagId);
  let inDistribution = true;
  if (gate?.centroid.length === embedding.length) {
    const cos = cosineSimilarity(embedding, gate.centroid);
    inDistribution = cos >= gate.minCosineToCentroid;
  }
  if (best.confidence < model.confidenceThreshold || !inDistribution) {
    return {
      tagId: null,
      confidence: best.confidence,
      inDistribution,
      ranked,
    };
  }
  return {
    tagId: best.tagId,
    confidence: best.confidence,
    inDistribution: true,
    ranked,
  };
}
