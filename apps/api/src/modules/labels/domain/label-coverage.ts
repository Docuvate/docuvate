import { cosineSimilarity } from './cosine.js';
import { DEFAULT_LABEL_NEAR_SIMILARITY_THRESHOLD } from './label-near-threshold.js';
import { countCoverageGaps, coveredDocumentPercent } from './label-coverage-score.js';

/** Same default as embedding auto-suggestions — operational “inside label content space”. */
export const LABEL_CONTENT_SIM_THRESHOLD = DEFAULT_LABEL_NEAR_SIMILARITY_THRESHOLD;

export type LabelMapCoverageStatus = 'explained' | 'unexplained' | 'outside' | 'unlabeled_near';

export type TagCentroidRef = {
  tagId: string;
  centroid: number[];
};

export type DocumentCoverageResult = {
  status: LabelMapCoverageStatus;
  bestAnySimilarity: number;
  bestAssignedSimilarity: number | null;
  nearestTagId: string | null;
};

export function computeDocumentCoverage(
  embedding: number[],
  assignedTagIds: string[],
  centroids: TagCentroidRef[],
  threshold: number = LABEL_CONTENT_SIM_THRESHOLD
): DocumentCoverageResult {
  if (centroids.length === 0 || embedding.length === 0) {
    const hasLabels = assignedTagIds.length > 0;
    return {
      status: hasLabels ? 'unexplained' : 'outside',
      bestAnySimilarity: 0,
      bestAssignedSimilarity: hasLabels ? 0 : null,
      nearestTagId: null,
    };
  }

  let bestAny = -1;
  let nearestTagId: string | null = null;
  const simByTag = new Map<string, number>();

  for (const { tagId, centroid } of centroids) {
    const sim = cosineSimilarity(embedding, centroid);
    simByTag.set(tagId, sim);
    if (sim > bestAny) {
      bestAny = sim;
      nearestTagId = tagId;
    }
  }

  const assigned = assignedTagIds.filter((id) => simByTag.has(id));
  if (assigned.length > 0) {
    let bestAssigned = -1;
    for (const tagId of assigned) {
      bestAssigned = Math.max(bestAssigned, simByTag.get(tagId) ?? 0);
    }
    const status: LabelMapCoverageStatus =
      bestAssigned >= threshold ? 'explained' : 'unexplained';
    return {
      status,
      bestAnySimilarity: bestAny,
      bestAssignedSimilarity: bestAssigned,
      nearestTagId,
    };
  }

  const status: LabelMapCoverageStatus =
    bestAny >= threshold ? 'unlabeled_near' : 'outside';
  return {
    status,
    bestAnySimilarity: bestAny,
    bestAssignedSimilarity: null,
    nearestTagId,
  };
}

export type LabelMapCoverageSummary = {
  explained: number;
  unexplained: number;
  outside: number;
  unlabeledNear: number;
  threshold: number;
  coveredPercent: number;
  gapCount: number;
};

export function summarizeCoverage(
  statuses: LabelMapCoverageStatus[],
  threshold: number = LABEL_CONTENT_SIM_THRESHOLD
): LabelMapCoverageSummary {
  const summary: LabelMapCoverageSummary = {
    explained: 0,
    unexplained: 0,
    outside: 0,
    unlabeledNear: 0,
    threshold,
    coveredPercent: 100,
    gapCount: 0,
  };
  for (const status of statuses) {
    switch (status) {
      case 'explained':
        summary.explained += 1;
        break;
      case 'unexplained':
        summary.unexplained += 1;
        break;
      case 'outside':
        summary.outside += 1;
        break;
      case 'unlabeled_near':
        summary.unlabeledNear += 1;
        break;
      default: {
        const _exhaustive: never = status;
        void _exhaustive;
      }
    }
  }
  const total = statuses.length;
  summary.gapCount = countCoverageGaps(statuses);
  summary.coveredPercent = coveredDocumentPercent(summary.explained, total);
  return summary;
}
