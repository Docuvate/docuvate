// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './cosine.js';

function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    return [];
  }
  const dim = embeddings[0]?.length ?? 0;
  if (dim === 0) {
    return [];
  }
  const sum = new Array<number>(dim).fill(0);
  for (const vector of embeddings) {
    if (vector.length !== dim) {
      continue;
    }
    for (let i = 0; i < dim; i += 1) {
      sum[i] += vector[i] ?? 0;
    }
  }
  const count = embeddings.length;
  return sum.map((value) => value / count);
}

export function clusterDocumentSimilarities(
  documentIds: string[],
  embeddingByDocumentId: ReadonlyMap<string, number[]>
): Map<string, number> {
  const memberEmbeddings: number[][] = [];
  for (const documentId of documentIds) {
    const embedding = embeddingByDocumentId.get(documentId);
    if (embedding && embedding.length > 0) {
      memberEmbeddings.push(embedding);
    }
  }
  const centroid = averageEmbeddings(memberEmbeddings);
  if (centroid.length === 0) {
    return new Map();
  }
  const out = new Map<string, number>();
  for (const documentId of documentIds) {
    const embedding = embeddingByDocumentId.get(documentId);
    if (!embedding || embedding.length === 0) {
      continue;
    }
    out.set(documentId, cosineSimilarity(embedding, centroid));
  }
  return out;
}
