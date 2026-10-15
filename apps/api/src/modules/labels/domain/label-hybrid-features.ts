// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  normalizeSearchText,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';

export const HYBRID_MAX_VOCAB = 4096;
export const HYBRID_EMBED_FEATURE_WEIGHT = 1.25;
export const HYBRID_TFIDF_FEATURE_WEIGHT = 1.0;

export interface HybridCorpusRow {
  text: string;
}

export interface HybridFeatureModel {
  vocabulary: string[];
  idf: number[];
}

export function l2Normalize(values: number[]): number[] {
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

export function buildHybridVocabulary(rows: readonly HybridCorpusRow[]): string[] {
  const df = new Map<string, number>();
  for (const row of rows) {
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
    .slice(0, HYBRID_MAX_VOCAB)
    .map(([token]) => token);
}

export function buildHybridIdf(
  rows: readonly HybridCorpusRow[],
  vocabulary: readonly string[]
): number[] {
  const n = rows.length;
  const df: number[] = Array.from({ length: vocabulary.length }, () => 0);
  for (const row of rows) {
    const present = new Set(tokenizeSearchQuery(normalizeSearchText(row.text)));
    for (let i = 0; i < vocabulary.length; i++) {
      if (present.has(vocabulary[i])) {
        df[i] += 1;
      }
    }
  }
  return df.map((d) => Math.log((1 + n) / (1 + d)) + 1);
}

export function buildHybridFeatureModel(rows: readonly HybridCorpusRow[]): HybridFeatureModel {
  const vocabulary = buildHybridVocabulary(rows);
  const idf = buildHybridIdf(rows, vocabulary);
  return { vocabulary, idf };
}

export function hybridTfidfVector(
  text: string,
  vocabulary: readonly string[],
  idf: readonly number[]
): number[] {
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

export function hybridFeatureVector(
  embedding: number[],
  text: string,
  model: HybridFeatureModel
): number[] {
  const tfidf = hybridTfidfVector(text, model.vocabulary, model.idf);
  const embed = l2Normalize(embedding);
  const weightedTfidf = tfidf.map((v) => v * HYBRID_TFIDF_FEATURE_WEIGHT);
  const weightedEmbed = embed.map((v) => v * HYBRID_EMBED_FEATURE_WEIGHT);
  return [1, ...weightedTfidf, ...weightedEmbed];
}
