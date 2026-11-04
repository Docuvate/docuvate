// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { computeDocumentCoverage } from './label-coverage.js';
import { type LabelHybridModel, predictLabelHybrid } from './label-hybrid-auto-match.js';
import { discoverOpenSetNewLabelClusters } from './label-open-set-discovery.js';
import type { TagCentroidRef } from './tag-centroid-ref.js';

interface AssignRecommendation {
  id: string;
  documentId: string;
  tagId: string;
  tagName: string;
  score: number;
  similarity: number;
  reason: string;
}

interface EmbeddingClusterNewLabel {
  id: string;
  proposedName: string;
  score: number;
  similarity: number;
  reason: string;
  reasonKey?: string;
  reasonParams?: { peerCount: number; matchPercent: number };
  documentIds: string[];
}

const MIN_LABEL_SUPPORT_FOR_SIMILARITY_PCT = 3;

type SimilarityDisplayTier = 'high' | 'medium' | 'low';

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
  return `Labelraum · ${String(pct)} % zu „${input.tagName}"`;
}

export function suggestAssignRecommendations(input: {
  rows: {
    documentId: string;
    embedding: number[];
    nonInboxTagIds: string[];
    text: string;
  }[];
  centroids: TagCentroidRef[];
  tagNameById: ReadonlyMap<string, string>;
  labelSupportCountByTagId: ReadonlyMap<string, number>;
  threshold: number;
  dismissedKeys: ReadonlySet<string>;
  hybridModel?: LabelHybridModel | null;
}): AssignRecommendation[] {
  const out: AssignRecommendation[] = [];
  for (const row of input.rows) {
    if (row.nonInboxTagIds.length > 0 || row.embedding.length === 0) {
      continue;
    }
    let tagId: string | null = null;
    let similarity = 0;
    if (input.hybridModel) {
      const prediction = predictLabelHybrid(input.hybridModel, row.embedding, row.text);
      tagId = prediction.tagId;
      similarity = prediction.confidence;
    } else {
      const coverage = computeDocumentCoverage(
        row.embedding,
        row.nonInboxTagIds,
        input.centroids,
        input.threshold
      );
      if (coverage.status !== 'unlabeled_near' || !coverage.nearestTagId) {
        continue;
      }
      tagId = coverage.nearestTagId;
      similarity = coverage.bestAnySimilarity;
    }
    if (!tagId) {
      continue;
    }
    const tagName = input.tagNameById.get(tagId);
    if (!tagName) {
      continue;
    }
    const id = `assign:${row.documentId}:${tagId}`;
    if (input.dismissedKeys.has(id)) {
      continue;
    }
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

export function suggestEmbeddingClusterNewLabels(input: {
  rows: {
    documentId: string;
    embedding: number[];
    nonInboxTagIds: string[];
    title: string;
    filename: string;
    text: string;
    fields: { key: string; value: string }[];
  }[];
  centroids: TagCentroidRef[];
  threshold: number;
  dismissedKeys: ReadonlySet<string>;
}): EmbeddingClusterNewLabel[] {
  const clusters = discoverOpenSetNewLabelClusters({
    rows: input.rows,
    centroids: input.centroids,
    threshold: input.threshold,
    dismissedKeys: input.dismissedKeys,
  });
  return clusters.map((cluster) => ({
    id: cluster.id,
    proposedName: cluster.proposedName,
    score: cluster.score,
    similarity: cluster.similarity,
    reason: cluster.reason,
    reasonKey: cluster.reasonKey,
    reasonParams: cluster.reasonParams,
    documentIds: cluster.documentIds,
  }));
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
