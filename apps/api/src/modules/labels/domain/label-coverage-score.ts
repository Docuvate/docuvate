import { cosineSimilarity } from './cosine.js';
import type { TagCentroidRef } from './label-coverage.js';

export type LabeledDocumentEmbedding = {
  embedding: number[];
  nonInboxTagIds: string[];
};

/**
 * Max cosine similarity to any label centroid or any document that already has labels.
 * Used for gap ordering in Labelraum (original embedding space, not projection).
 */
export function computeCoverageSimilarity(
  embedding: number[],
  centroids: TagCentroidRef[],
  labeledDocuments: LabeledDocumentEmbedding[]
): number {
  if (embedding.length === 0) {
    return 0;
  }

  let best = -1;
  for (const { centroid } of centroids) {
    if (centroid.length === 0) {
      continue;
    }
    best = Math.max(best, cosineSimilarity(embedding, centroid));
  }
  for (const doc of labeledDocuments) {
    if (doc.nonInboxTagIds.length === 0 || doc.embedding.length === 0) {
      continue;
    }
    best = Math.max(best, cosineSimilarity(embedding, doc.embedding));
  }
  return best < 0 ? 0 : best;
}

export function countCoverageGaps(
  statuses: Array<'explained' | 'unexplained' | 'outside' | 'unlabeled_near'>
): number {
  return statuses.filter((s) => s !== 'explained').length;
}

export function coveredDocumentPercent(explained: number, total: number): number {
  if (total <= 0) {
    return 100;
  }
  return Math.round((explained / total) * 100);
}
