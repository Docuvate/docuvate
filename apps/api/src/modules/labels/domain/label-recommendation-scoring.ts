// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagCentroidRef } from './label-coverage.js';
import { computeDocumentCoverage } from './label-coverage.js';
import { cosineSimilarity } from './cosine.js';
import {
  inferClusterLabelNameFromSnippets,
  normalizeLabelKey,
  type TagPairSignal,
} from './label-vocabulary.js';

export type AssignRecommendation = {
  id: string;
  documentId: string;
  tagId: string;
  tagName: string;
  score: number;
  similarity: number;
  reason: string;
};

export type EmbeddingClusterNewLabel = {
  id: string;
  proposedName: string;
  score: number;
  similarity: number;
  reason: string;
  documentIds: string[];
};

export type EmbeddingMergeRecommendation = {
  id: string;
  tagIds: [string, string];
  names: [string, string];
  score: number;
  similarity: number;
  reason: string;
};

export const MIN_LABEL_SUPPORT_FOR_MERGE = 3;
export const MIN_LABEL_SUPPORT_FOR_SIMILARITY_PCT = 3;

export type SimilarityDisplayTier = 'high' | 'medium' | 'low';

export function similarityDisplayTier(similarity: number): SimilarityDisplayTier {
  if (similarity >= 0.8) {
    return 'high';
  }
  if (similarity >= 0.65) {
    return 'medium';
  }
  return 'low';
}

export function formatAssignRecommendationReason(input: {
  tagName: string;
  similarity: number;
  labelSupportCount: number;
}): string {
  if (input.labelSupportCount < MIN_LABEL_SUPPORT_FOR_SIMILARITY_PCT) {
    const tier =
      similarityDisplayTier(input.similarity) === 'high'
        ? 'hohe'
        : similarityDisplayTier(input.similarity) === 'medium'
          ? 'mittlere'
          : 'niedrige';
    return `Labelraum · ${tier} Ähnlichkeit zu „${input.tagName}"`;
  }
  const pct = Math.min(99, Math.round(input.similarity * 100));
  return `Labelraum · ${pct} % zu „${input.tagName}"`;
}

export function formatMergeRecommendationReason(input: {
  nameA: string;
  nameB: string;
  similarity: number;
  supportCount: number;
  scoredReason?: string;
}): string {
  if (input.supportCount < MIN_LABEL_SUPPORT_FOR_SIMILARITY_PCT) {
    const tier =
      similarityDisplayTier(input.similarity) === 'high'
        ? 'hohe'
        : similarityDisplayTier(input.similarity) === 'medium'
          ? 'mittlere'
          : 'niedrige';
    return `Sehr ähnliche Namen (${input.nameA} / ${input.nameB}) · ${tier} Überschneidung`;
  }
  if (input.scoredReason) {
    return input.scoredReason;
  }
  const pct = Math.min(99, Math.round(input.similarity * 100));
  return `Labelraum · ${pct} % Überschneidung (${input.nameA} / ${input.nameB})`;
}

export function suggestAssignRecommendations(input: {
  rows: { documentId: string; embedding: number[]; nonInboxTagIds: string[] }[];
  centroids: TagCentroidRef[];
  tagNameById: ReadonlyMap<string, string>;
  labelSupportCountByTagId: ReadonlyMap<string, number>;
  threshold: number;
  dismissedKeys: ReadonlySet<string>;
}): AssignRecommendation[] {
  const out: AssignRecommendation[] = [];
  for (const row of input.rows) {
    if (row.nonInboxTagIds.length > 0 || row.embedding.length === 0) {
      continue;
    }
    const coverage = computeDocumentCoverage(
      row.embedding,
      row.nonInboxTagIds,
      input.centroids,
      input.threshold
    );
    if (coverage.status !== 'unlabeled_near' || !coverage.nearestTagId) {
      continue;
    }
    const tagId = coverage.nearestTagId;
    const tagName = input.tagNameById.get(tagId);
    if (!tagName) {
      continue;
    }
    const id = `assign:${row.documentId}:${tagId}`;
    if (input.dismissedKeys.has(id)) {
      continue;
    }
    const similarity = coverage.bestAnySimilarity;
    const labelSupportCount = input.labelSupportCountByTagId.get(tagId) ?? 0;
    out.push({
      id,
      documentId: row.documentId,
      tagId,
      tagName,
      score: similarity,
      similarity,
      reason: formatAssignRecommendationReason({ tagName, similarity, labelSupportCount }),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

function averageCrossSetSimilarity(a: number[][], b: number[][]): number | null {
  if (a.length === 0 || b.length === 0) {
    return null;
  }
  let sum = 0;
  let count = 0;
  for (const va of a) {
    for (const vb of b) {
      sum += cosineSimilarity(va, vb);
      count += 1;
    }
  }
  return count > 0 ? sum / count : null;
}

export function scoreLabelPairForMerge(
  a: TagPairSignal & { docEmbeddings: number[][] },
  b: TagPairSignal & { docEmbeddings: number[][] }
): { score: number; similarity: number; reason: string } | null {
  let centroidSim = 0;
  if (a.centroid.length > 0 && b.centroid.length > 0) {
    centroidSim = cosineSimilarity(a.centroid, b.centroid);
  }
  const cross = averageCrossSetSimilarity(a.docEmbeddings, b.docEmbeddings);
  const crossSim = cross ?? centroidSim;
  const hasDocs = a.docEmbeddings.length > 0 && b.docEmbeddings.length > 0;
  const combined = hasDocs ? 0.45 * centroidSim + 0.55 * crossSim : centroidSim;
  const pct = Math.round(combined * 100);
  const centroidPct = Math.round(centroidSim * 100);

  if (combined < 0.78 && centroidSim < 0.85) {
    return null;
  }

  const reason =
    hasDocs && cross != null
      ? `Labelraum · ${pct} % (Zentren ${centroidPct} %, Dokumente ${Math.round(cross * 100)} %)`
      : `Labelraum · ${pct} % (Zentren ${centroidPct} %)`;

  return {
    score: Math.min(0.99, combined),
    similarity: combined,
    reason,
  };
}

export function suggestEmbeddingMergeRecommendations(input: {
  tags: TagPairSignal[];
  docEmbeddingsByTagId: ReadonlyMap<string, number[][]>;
  dismissedKeys: ReadonlySet<string>;
  nameNearDuplicate: (a: string, b: string) => boolean;
}): EmbeddingMergeRecommendation[] {
  const out: EmbeddingMergeRecommendation[] = [];
  for (let i = 0; i < input.tags.length; i++) {
    for (let j = i + 1; j < input.tags.length; j++) {
      const a = input.tags[i]!;
      const b = input.tags[j]!;
      const idPair = [a.tagId, b.tagId].sort();
      const mergeId = `merge:${idPair[0]}:${idPair[1]}`;
      if (input.dismissedKeys.has(mergeId)) {
        continue;
      }

      const aDocs = input.docEmbeddingsByTagId.get(a.tagId) ?? [];
      const bDocs = input.docEmbeddingsByTagId.get(b.tagId) ?? [];
      if (
        aDocs.length < MIN_LABEL_SUPPORT_FOR_MERGE ||
        bDocs.length < MIN_LABEL_SUPPORT_FOR_MERGE
      ) {
        continue;
      }

      const nameDup = input.nameNearDuplicate(a.name, b.name);
      if (!nameDup) {
        continue;
      }

      const scored = scoreLabelPairForMerge(
        { ...a, docEmbeddings: aDocs },
        { ...b, docEmbeddings: bDocs }
      );
      if (!scored || scored.similarity < 0.78) {
        continue;
      }

      const supportCount = Math.min(aDocs.length, bDocs.length);
      const sim = scored.similarity;
      out.push({
        id: mergeId,
        tagIds: [a.tagId, b.tagId],
        names: [a.name, b.name],
        score: Math.min(0.99, scored.score),
        similarity: sim,
        reason: formatMergeRecommendationReason({
          nameA: a.name,
          nameB: b.name,
          similarity: sim,
          supportCount,
          scoredReason: scored.reason,
        }),
      });
    }
  }
  return out.sort((x, y) => y.score - x.score).slice(0, 6);
}

function clusterKey(documentIds: string[]): string {
  return documentIds.slice().sort().join(',');
}

export function suggestEmbeddingClusterNewLabels(input: {
  rows: {
    documentId: string;
    embedding: number[];
    nonInboxTagIds: string[];
    textSnippet: string;
  }[];
  centroids: TagCentroidRef[];
  threshold: number;
  dismissedKeys: ReadonlySet<string>;
  minClusterSize?: number;
  minPairwiseSim?: number;
}): EmbeddingClusterNewLabel[] {
  const minClusterSize = input.minClusterSize ?? 2;
  const minPairwiseSim = input.minPairwiseSim ?? 0.72;

  const outside = input.rows.filter((row) => {
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

  if (outside.length < minClusterSize) {
    return [];
  }

  const used = new Set<string>();
  const clusters: { documentIds: string[]; cohesion: number }[] = [];

  for (const seed of outside) {
    if (used.has(seed.documentId)) {
      continue;
    }
    const members = [seed];
    for (const other of outside) {
      if (other.documentId === seed.documentId || used.has(other.documentId)) {
        continue;
      }
      const sim = cosineSimilarity(seed.embedding, other.embedding);
      if (sim >= minPairwiseSim) {
        members.push(other);
      }
    }
    if (members.length < minClusterSize) {
      continue;
    }
    let simSum = 0;
    let pairs = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        simSum += cosineSimilarity(members[i]!.embedding, members[j]!.embedding);
        pairs += 1;
      }
    }
    const cohesion = pairs > 0 ? simSum / pairs : minPairwiseSim;
    const documentIds = members.map((m) => m.documentId);
    for (const id of documentIds) {
      used.add(id);
    }
    clusters.push({ documentIds, cohesion });
  }

  const results: EmbeddingClusterNewLabel[] = [];
  for (const cluster of clusters) {
    const key = clusterKey(cluster.documentIds);
    const id = `new:cluster:${normalizeLabelKey(key).replace(/\s+/g, '-')}`;
    if (input.dismissedKeys.has(id)) {
      continue;
    }

    const clusterSnippets = input.rows
      .filter((r) => cluster.documentIds.includes(r.documentId))
      .map((r) => r.textSnippet);
    const proposedName = inferClusterLabelNameFromSnippets(clusterSnippets);
    if (!proposedName) {
      continue;
    }
    const dismissNameKey = `new:${normalizeLabelKey(proposedName)}`;
    if (input.dismissedKeys.has(dismissNameKey)) {
      continue;
    }

    const pct = Math.round(cluster.cohesion * 100);
    results.push({
      id,
      proposedName,
      score: Math.min(0.9, 0.55 + cluster.cohesion * 0.35),
      similarity: cluster.cohesion,
      reason: `${cluster.documentIds.length} ähnliche Dokumente ohne Label · ${pct} % Übereinstimmung`,
      documentIds: cluster.documentIds,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function parseAssignRecommendationId(
  recommendationId: string
): { documentId: string; tagId: string } | null {
  if (!recommendationId.startsWith('assign:')) {
    return null;
  }
  const parts = recommendationId.split(':');
  if (parts.length !== 3) {
    return null;
  }
  const documentId = parts[1]?.trim();
  const tagId = parts[2]?.trim();
  if (!documentId || !tagId) {
    return null;
  }
  return { documentId, tagId };
}
