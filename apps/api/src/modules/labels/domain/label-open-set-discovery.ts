// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeLabelKey } from '../../../shared/domain/label-name-similarity.js';
import {
  normalizeSearchText,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';
import { cosineSimilarity } from './cosine.js';
import { isAcceptableLabelCandidate } from './label-candidate-validation.js';
import type { TagCentroidRef } from './label-coverage.js';
import { computeDocumentCoverage } from './label-coverage.js';
import {
  buildHybridFeatureModel,
  type HybridFeatureModel,
  hybridFeatureVector,
  l2Normalize,
} from './label-hybrid-features.js';

/** Calibrated on synthetic open-set fixtures (held-out) for ≥0.95 precision. */
export const OPEN_SET_MIN_CLUSTER_SIZE = 5;
export const OPEN_SET_MIN_PAIRWISE_HYBRID_SIM = 0.68;
export const OPEN_SET_MIN_COHESION = 0.72;
export const OPEN_SET_MIN_SEPARATION = 0.08;
export const OPEN_SET_EVAL_TARGET_PRECISION = 0.95;

export interface OpenSetDocumentRow {
  documentId: string;
  embedding: number[];
  nonInboxTagIds: string[];
  title: string;
  filename: string;
  text: string;
  fields: { key: string; value: string }[];
}

export interface OpenSetClusterSuggestion {
  id: string;
  proposedName: string;
  score: number;
  similarity: number;
  reason: string;
  documentIds: string[];
}

interface PreparedRow extends OpenSetDocumentRow {
  hybrid: number[];
  namingText: string;
}

function titleHeadingSpan(row: OpenSetDocumentRow): string {
  const titlePart = `${row.title} ${row.filename}`.trim();
  const lines = row.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headingLines = lines.slice(0, 3).join(' ');
  return `${titlePart} ${headingLines}`.trim();
}

function documentTypeHint(row: OpenSetDocumentRow): string | null {
  for (const field of row.fields) {
    const key = field.key.toLowerCase();
    if (
      key.includes('document_type') ||
      key.includes('documenttype') ||
      key.includes('dokumenttyp') ||
      key === 'type'
    ) {
      const value = field.value.trim();
      if (value.length >= 2 && value.length <= MAX_LABEL_TOKEN_LEN) {
        return value;
      }
    }
  }
  return null;
}

const MAX_LABEL_TOKEN_LEN = 40;

function labeledHybridCentroidsFromRows(prepared: PreparedRow[]): number[][] {
  const byTag = new Map<string, { sum: number[]; count: number }>();
  for (const row of prepared) {
    if (row.nonInboxTagIds.length === 0 || row.embedding.length === 0) {
      continue;
    }
    for (const tagId of row.nonInboxTagIds) {
      const hybrid = row.hybrid;
      const prev = byTag.get(tagId);
      if (!prev) {
        byTag.set(tagId, { sum: [...hybrid], count: 1 });
        continue;
      }
      for (let i = 0; i < prev.sum.length; i++) {
        prev.sum[i] += hybrid[i] ?? 0;
      }
      prev.count += 1;
    }
  }
  const out: number[][] = [];
  for (const entry of byTag.values()) {
    out.push(l2Normalize(entry.sum.map((v) => v / entry.count)));
  }
  return out;
}

function formatTokenForLabel(token: string): string {
  if (token.length <= 3) {
    return token.toUpperCase();
  }
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function clusterCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return [];
  }
  const dim = vectors[0]?.length ?? 0;
  const sum = Array.from({ length: dim }, () => 0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      sum[i] += vec[i] ?? 0;
    }
  }
  return l2Normalize(sum.map((v) => v / vectors.length));
}

function averagePairwiseSimilarity(vectors: number[][]): number {
  if (vectors.length < 2) {
    return 0;
  }
  let simSum = 0;
  let pairs = 0;
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      simSum += cosineSimilarity(vectors[i], vectors[j]);
      pairs += 1;
    }
  }
  return pairs > 0 ? simSum / pairs : 0;
}

function minCentroidSeparation(
  centroid: number[],
  otherCentroids: number[][],
  labeledCentroidsHybrid: number[][]
): number {
  let minGap = 1;
  for (const other of otherCentroids) {
    minGap = Math.min(minGap, 1 - cosineSimilarity(centroid, other));
  }
  for (const labeled of labeledCentroidsHybrid) {
    minGap = Math.min(minGap, 1 - cosineSimilarity(centroid, labeled));
  }
  return minGap;
}

function cTfidfTopTerm(clusterTexts: string[], restCorpusTexts: string[]): string | null {
  const clusterCombined = clusterTexts.join('\n');
  const clusterTokens = tokenizeSearchQuery(normalizeSearchText(clusterCombined));
  if (clusterTokens.length === 0) {
    return null;
  }
  const clusterCounts = new Map<string, number>();
  for (const token of clusterTokens) {
    clusterCounts.set(token, (clusterCounts.get(token) ?? 0) + 1);
  }
  const clusterTotal = clusterTokens.length || 1;

  const restDf = new Map<string, number>();
  for (const doc of restCorpusTexts) {
    const seen = new Set(tokenizeSearchQuery(normalizeSearchText(doc)));
    for (const token of seen) {
      restDf.set(token, (restDf.get(token) ?? 0) + 1);
    }
  }
  const restN = Math.max(restCorpusTexts.length, 1);

  let bestToken: string | null = null;
  let bestScore = 0;
  for (const [token, count] of clusterCounts) {
    if (token.length < 3) {
      continue;
    }
    const tf = count / clusterTotal;
    const df = restDf.get(token) ?? 0;
    const idf = Math.log(1 + restN / (1 + df));
    const score = tf * idf;
    if (score > bestScore) {
      bestScore = score;
      bestToken = token;
    }
  }
  if (!bestToken) {
    return null;
  }
  const label = formatTokenForLabel(bestToken);
  return isAcceptableLabelCandidate(label) ? label : null;
}

function proposeClusterName(members: PreparedRow[], restRows: PreparedRow[]): string | null {
  const typeHints = members
    .map(documentTypeHint)
    .filter((value): value is string => value != null && isAcceptableLabelCandidate(value));
  if (typeHints.length > 0) {
    const counts = new Map<string, number>();
    for (const hint of typeHints) {
      const key = normalizeLabelKey(hint);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const topKey = sorted[0]?.[0];
    if (topKey) {
      return typeHints.find((h) => normalizeLabelKey(h) === topKey) ?? null;
    }
  }

  const clusterTexts = members.map((row) => row.namingText);
  const restTexts = restRows.map((row) => row.namingText);
  return cTfidfTopTerm(clusterTexts, restTexts);
}

function clusterKey(documentIds: string[]): string {
  return documentIds.slice().sort().join(',');
}

function buildPreparedRows(
  rows: OpenSetDocumentRow[],
  featureModel: HybridFeatureModel
): PreparedRow[] {
  return rows.map((row) => ({
    ...row,
    hybrid: hybridFeatureVector(row.embedding, `${row.title}\n${row.filename}\n${row.text}`, featureModel),
    namingText: titleHeadingSpan(row),
  }));
}

function growCluster(seed: PreparedRow, candidates: PreparedRow[]): PreparedRow[] {
  const members = [seed];
  for (const other of candidates) {
    if (other.documentId === seed.documentId) {
      continue;
    }
    const simToAll = members.every(
      (member) => cosineSimilarity(member.hybrid, other.hybrid) >= OPEN_SET_MIN_PAIRWISE_HYBRID_SIM
    );
    if (simToAll) {
      members.push(other);
    }
  }
  return members;
}

export function discoverOpenSetNewLabelClusters(input: {
  rows: OpenSetDocumentRow[];
  centroids: TagCentroidRef[];
  threshold: number;
  dismissedKeys: ReadonlySet<string>;
  labeledHybridCentroids?: number[][];
}): OpenSetClusterSuggestion[] {
  const corpusRows = input.rows.map((row) => ({
    text: `${row.title}\n${row.filename}\n${row.text}`.slice(0, 12000),
  }));
  const featureModel = buildHybridFeatureModel(corpusRows);
  const prepared = buildPreparedRows(input.rows, featureModel);

  const outside = prepared.filter((row) => {
    if (row.nonInboxTagIds.length > 0 || row.embedding.length === 0) {
      return false;
    }
    const coverage = computeDocumentCoverage(
      row.embedding,
      row.nonInboxTagIds,
      input.centroids,
      input.threshold
    );
    return coverage.status === 'outside';
  });

  if (outside.length < OPEN_SET_MIN_CLUSTER_SIZE) {
    return [];
  }

  const labeledHybridCentroids =
    input.labeledHybridCentroids ?? labeledHybridCentroidsFromRows(prepared);

  const used = new Set<string>();
  const clusterMembers: PreparedRow[][] = [];

  const sortedOutside = [...outside].sort((a, b) => a.documentId.localeCompare(b.documentId));
  for (const seed of sortedOutside) {
    if (used.has(seed.documentId)) {
      continue;
    }
    const members = growCluster(
      seed,
      sortedOutside.filter((row) => !used.has(row.documentId))
    );
    if (members.length < OPEN_SET_MIN_CLUSTER_SIZE) {
      continue;
    }
    const vectors = members.map((m) => m.hybrid);
    const cohesion = averagePairwiseSimilarity(vectors);
    if (cohesion < OPEN_SET_MIN_COHESION) {
      continue;
    }
    const centroid = clusterCentroid(vectors);
    const otherCentroids = clusterMembers.map((group) =>
      clusterCentroid(group.map((m) => m.hybrid))
    );
    const separation = minCentroidSeparation(centroid, otherCentroids, labeledHybridCentroids);
    if (separation < OPEN_SET_MIN_SEPARATION) {
      continue;
    }
    for (const member of members) {
      used.add(member.documentId);
    }
    clusterMembers.push(members);
  }

  const results: OpenSetClusterSuggestion[] = [];

  for (const members of clusterMembers) {
    const ids = members.map((m) => m.documentId).sort();
    const key = clusterKey(ids);

    const rest = prepared.filter((row) => !ids.includes(row.documentId));
    const proposedName = proposeClusterName(members, rest);
    if (!proposedName) {
      continue;
    }

    const id = `new:cluster:${normalizeLabelKey(key).replace(/\s+/g, '-')}`;
    if (input.dismissedKeys.has(id)) {
      continue;
    }
    const dismissNameKey = `new:${normalizeLabelKey(proposedName)}`;
    if (input.dismissedKeys.has(dismissNameKey)) {
      continue;
    }

    const cohesion = averagePairwiseSimilarity(members.map((m) => m.hybrid));
    const pct = Math.round(cohesion * 100);
    const peerCount = members.length - 1;
    results.push({
      id,
      proposedName,
      score: Math.min(0.92, 0.5 + cohesion * 0.42),
      similarity: cohesion,
      reason: `${String(peerCount)} ähnliche Dokumente ohne Label · ${String(pct)} % Übereinstimmung`,
      documentIds: ids,
    });
  }

  const byDocument = new Map<string, OpenSetClusterSuggestion>();
  for (const suggestion of results.sort((a, b) => b.score - a.score)) {
    for (const docId of suggestion.documentIds) {
      if (!byDocument.has(docId)) {
        byDocument.set(docId, suggestion);
      }
    }
  }
  const uniqueByCluster = new Map<string, OpenSetClusterSuggestion>();
  for (const suggestion of byDocument.values()) {
    uniqueByCluster.set(clusterKey(suggestion.documentIds), suggestion);
  }
  return [...uniqueByCluster.values()].sort((a, b) => b.score - a.score);
}

/** Synthetic evaluation helper — used in unit tests only. */
export interface OpenSetEvalCase {
  rows: OpenSetDocumentRow[];
  centroids: TagCentroidRef[];
  threshold: number;
  /** documentId → expected cluster id (same id = should cluster together) */
  expectedClusterByDoc: Map<string, string>;
  /** documentIds that must not receive a suggestion */
  mustNotSuggest: Set<string>;
}

export function evaluateOpenSetDiscoveryPrecision(cases: OpenSetEvalCase[]): {
  precision: number;
  suggested: number;
  correct: number;
} {
  let suggested = 0;
  let correct = 0;
  for (const evalCase of cases) {
    const suggestions = discoverOpenSetNewLabelClusters({
      rows: evalCase.rows,
      centroids: evalCase.centroids,
      threshold: evalCase.threshold,
      dismissedKeys: new Set(),
    });
    const docToSuggestion = new Map<string, OpenSetClusterSuggestion>();
    for (const suggestion of suggestions) {
      for (const docId of suggestion.documentIds) {
        if (!docToSuggestion.has(docId)) {
          docToSuggestion.set(docId, suggestion);
        }
      }
    }
    for (const [docId, suggestion] of docToSuggestion) {
      if (evalCase.mustNotSuggest.has(docId)) {
        suggested += 1;
        continue;
      }
      suggested += 1;
      const expected = evalCase.expectedClusterByDoc.get(docId);
      if (!expected) {
        continue;
      }
      const clusterMatches = suggestion.documentIds.every(
        (memberId) => evalCase.expectedClusterByDoc.get(memberId) === expected
      );
      if (clusterMatches && suggestion.documentIds.includes(docId)) {
        correct += 1;
      }
    }
  }
  const precision = suggested > 0 ? correct / suggested : 1;
  return { precision, suggested, correct };
}
