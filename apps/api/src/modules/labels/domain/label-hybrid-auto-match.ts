// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  normalizeSearchText,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';
import { cosineSimilarity } from './cosine.js';

const MAX_VOCAB = 4096;
const MIN_CLASS_EXAMPLES = 2;
const MIN_TRAINED_CLASSES = 2;
const LOO_TARGET_PRECISION = 0.95;
const EMBED_FEATURE_WEIGHT = 1.25;
const TFIDF_FEATURE_WEIGHT = 1.0;
const TRAIN_EPOCHS = 48;
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

function buildVocabulary(examples: readonly LabelHybridTrainingExample[]): string[] {
  const df = new Map<string, number>();
  for (const row of examples) {
    const seen = new Set<string>();
    for (const token of tokenizeSearchQuery(normalizeSearchText(row.text))) {
      if (token.length < 2) {
        continue;
      }
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  return [...df.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_VOCAB)
    .map(([token]) => token);
}

function tfidfVector(text: string, vocabulary: readonly string[], idf: readonly number[]): number[] {
  const counts = new Map<string, number>();
  for (const token of tokenizeSearchQuery(normalizeSearchText(text))) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const out: number[] = Array.from({ length: vocabulary.length }, () => 0);
  for (let i = 0; i < vocabulary.length; i++) {
    const token = vocabulary[i];
    const tf = (counts.get(token) ?? 0) / total;
    out[i] = tf * (idf[i] ?? 0);
  }
  return l2Normalize(out);
}

function buildIdf(examples: readonly LabelHybridTrainingExample[], vocabulary: readonly string[]): number[] {
  const n = examples.length;
  const df: number[] = Array.from({ length: vocabulary.length }, () => 0);
  for (const row of examples) {
    const present = new Set(tokenizeSearchQuery(normalizeSearchText(row.text)));
    for (let i = 0; i < vocabulary.length; i++) {
      if (present.has(vocabulary[i])) {
        df[i] += 1;
      }
    }
  }
  return df.map((d) => Math.log((1 + n) / (1 + d)) + 1);
}

function featureVector(
  embedding: number[],
  text: string,
  vocabulary: readonly string[],
  idf: readonly number[]
): number[] {
  const tfidf = tfidfVector(text, vocabulary, idf);
  const embed = l2Normalize(embedding);
  const weightedTfidf = tfidf.map((v) => v * TFIDF_FEATURE_WEIGHT);
  const weightedEmbed = embed.map((v) => v * EMBED_FEATURE_WEIGHT);
  return [1, ...weightedTfidf, ...weightedEmbed];
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function trainMultinomialLogistic(
  tagIds: readonly string[],
  rows: readonly { features: number[]; classIndex: number }[]
): number[][] {
  const dim = rows[0]?.features.length ?? 0;
  const weights: number[][] = tagIds.map(() => Array.from({ length: dim }, () => 0));
  for (let epoch = 0; epoch < TRAIN_EPOCHS; epoch++) {
    for (const row of rows) {
      const logits = weights.map((w) =>
        w.reduce((acc, coeff, idx) => acc + coeff * (row.features[idx] ?? 0), 0)
      );
      const probs = softmax(logits);
      for (let c = 0; c < weights.length; c++) {
        const target = c === row.classIndex ? 1 : 0;
        const err = probs[c] - target;
        for (let j = 0; j < dim; j++) {
          weights[c][j] -=
            TRAIN_LR * (err * (row.features[j] ?? 0) + L2 * weights[c][j]);
        }
      }
    }
  }
  return weights;
}

function predictProbs(model: LabelHybridModel, embedding: number[], text: string): number[] {
  const x = featureVector(embedding, text, model.vocabulary, model.idf);
  const logits = model.weightRows.map((w) =>
    w.reduce((acc, coeff, idx) => acc + coeff * (x[idx] ?? 0), 0)
  );
  return softmax(logits);
}

function buildClassGates(
  examples: readonly LabelHybridTrainingExample[],
  tagIds: readonly string[]
): LabelHybridClassGate[] {
  const sums = new Map<string, number[]>();
  const counts = new Map<string, number>();
  for (const row of examples) {
    if (!tagIds.includes(row.tagId) || row.embedding.length === 0) {
      continue;
    }
    const prev = sums.get(row.tagId);
    if (!prev) {
      sums.set(row.tagId, [...row.embedding]);
      counts.set(row.tagId, 1);
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
    const cosines = examples
      .filter((row) => row.tagId === tagId)
      .map((row) => cosineSimilarity(row.embedding, centroid))
      .sort((a, b) => a - b);
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

export function canTrainLabelHybridModel(examples: readonly LabelHybridTrainingExample[]): boolean {
  const counts = examplesPerClass(examples);
  const eligible = [...counts.values()].filter((c) => c >= MIN_CLASS_EXAMPLES).length;
  return eligible >= MIN_TRAINED_CLASSES;
}

function learnConfidenceThreshold(
  tagIds: readonly string[],
  examples: readonly LabelHybridTrainingExample[],
  vocabulary: readonly string[],
  idf: readonly number[]
): number {
  const looScores: { confidence: number; correct: boolean }[] = [];
  for (let hold = 0; hold < examples.length; hold++) {
    const held = examples[hold];
    const train = examples.filter((_, idx) => idx !== hold);
    const counts = examplesPerClass(train);
    const activeTags = tagIds.filter((tagId) => (counts.get(tagId) ?? 0) >= MIN_CLASS_EXAMPLES);
    if (activeTags.length < MIN_TRAINED_CLASSES) {
      continue;
    }
    const rows = train
      .filter((row) => activeTags.includes(row.tagId))
      .map((row) => ({
        features: featureVector(row.embedding, row.text, vocabulary, idf),
        classIndex: activeTags.indexOf(row.tagId),
      }));
    if (rows.length === 0) {
      continue;
    }
    const weights = trainMultinomialLogistic(activeTags, rows);
    const partial: LabelHybridModel = {
      tagIds: activeTags,
      vocabulary: [...vocabulary],
      idf: [...idf],
      weightRows: weights,
      embedDim: held.embedding.length,
      confidenceThreshold: 0,
      classGates: buildClassGates(train, activeTags),
    };
    const probs = predictProbs(partial, held.embedding, held.text);
    const bestIdx = probs.indexOf(Math.max(...probs));
    const predicted = activeTags[bestIdx];
    const gate = partial.classGates.find((row) => row.tagId === predicted);
    const inDist =
      gate?.centroid.length === held.embedding.length
        ? cosineSimilarity(held.embedding, gate.centroid) >= gate.minCosineToCentroid
        : true;
    if (!inDist) {
      continue;
    }
    looScores.push({
      confidence: probs[bestIdx] ?? 0,
      correct: predicted === held.tagId,
    });
  }
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

export function trainLabelHybridModel(
  examples: readonly LabelHybridTrainingExample[]
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
  const vocabulary = buildVocabulary(examples);
  const idf = buildIdf(examples, vocabulary);
  const rows = examples
    .filter((row) => tagIds.includes(row.tagId))
    .map((row) => ({
      features: featureVector(row.embedding, row.text, vocabulary, idf),
      classIndex: tagIds.indexOf(row.tagId),
    }));
  const weightRows = trainMultinomialLogistic(tagIds, rows);
  const embedDim = examples.find((row) => row.embedding.length > 0)?.embedding.length ?? 0;
  const classGates = buildClassGates(examples, tagIds);
  const confidenceThreshold = learnConfidenceThreshold(tagIds, examples, vocabulary, idf);
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
