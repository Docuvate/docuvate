// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface DuplicatePairEdge {
  documentId: string;
  candidateDocumentId: string;
}

export interface DuplicatePairMetaEdge extends DuplicatePairEdge {
  source: 'hash' | 'embedding' | 'smart';
  similarity: number;
}

export interface DuplicateSetDisplayInput {
  bulkArchiveEligible: boolean;
  maxSimilarity: number;
  sources: readonly ('hash' | 'embedding' | 'smart')[];
}

/** Stable id for a duplicate set from its member document ids. */
export function duplicateSetIdFromDocumentIds(documentIds: readonly string[]): string {
  return [...documentIds].sort().join('--');
}

export function parseDuplicateSetId(setId: string): string[] {
  if (!setId.trim()) return [];
  return setId.split('--').filter((part) => part.length > 0);
}

function canonicalPairKey(documentIdA: string, documentIdB: string): string {
  return documentIdA < documentIdB
    ? `${documentIdA}:${documentIdB}`
    : `${documentIdB}:${documentIdA}`;
}

/**
 * Hash-only connected components plus larger similarity groups.
 * Byte-identical pairs stay visible even when embedded in a broader similarity cluster.
 */
export function groupDuplicateSetsWithHashSubsets(
  allPairs: readonly DuplicatePairEdge[],
  hashPairs: readonly DuplicatePairEdge[]
): string[][] {
  const hashSets = groupDuplicatePairsIntoSets(hashPairs);
  const allSets = groupDuplicatePairsIntoSets(allPairs);
  const hashSetIds = new Set(hashSets.map((ids) => duplicateSetIdFromDocumentIds(ids)));
  const combined: string[][] = [...hashSets];
  for (const ids of allSets) {
    const setId = duplicateSetIdFromDocumentIds(ids);
    if (ids.length >= 3 || !hashSetIds.has(setId)) {
      combined.push(ids);
    }
  }
  const seenSetIds = new Set<string>();
  const unique: string[][] = [];
  for (const ids of combined) {
    const setId = duplicateSetIdFromDocumentIds(ids);
    if (seenSetIds.has(setId)) {
      continue;
    }
    seenSetIds.add(setId);
    unique.push(ids);
  }
  return unique;
}

/** Union-find grouping of pending duplicate pairs into connected sets (≥2 documents). */
export function groupDuplicatePairsIntoSets(pairs: readonly DuplicatePairEdge[]): string[][] {
  const parent = new Map<string, string>();

  function find(id: string): string {
    const existing = parent.get(id);
    if (!existing || existing === id) {
      parent.set(id, id);
      return id;
    }
    const root = find(existing);
    parent.set(id, root);
    return root;
  }

  function union(a: string, b: string): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  }

  const seenPairs = new Set<string>();
  for (const pair of pairs) {
    if (pair.documentId === pair.candidateDocumentId) continue;
    const key = canonicalPairKey(pair.documentId, pair.candidateDocumentId);
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    union(pair.documentId, pair.candidateDocumentId);
  }

  const buckets = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const root = find(id);
    const bucket = buckets.get(root);
    if (bucket) {
      bucket.push(id);
    } else {
      buckets.set(root, [id]);
    }
  }

  return [...buckets.values()]
    .map((ids) => [...ids].sort())
    .filter((ids) => ids.length >= 2);
}

/** Bulk “keep newest” is only safe when every edge in the set is byte-identical (hash). */
export function duplicateSetBulkArchiveEligible(
  documentIds: readonly string[],
  pairMeta: readonly DuplicatePairMetaEdge[]
): boolean {
  if (documentIds.length < 2 || pairMeta.length === 0) {
    return false;
  }
  const idSet = new Set(documentIds);
  const edgesInSet = pairMeta.filter(
    (edge) => idSet.has(edge.documentId) && idSet.has(edge.candidateDocumentId)
  );
  if (edgesInSet.length === 0) {
    return false;
  }
  return edgesInSet.every((edge) => edge.source === 'hash');
}

export function duplicateSetMaxSimilarityForDisplay(
  pairMeta: readonly DuplicatePairMetaEdge[],
  bulkArchiveEligible: boolean
): number {
  if (bulkArchiveEligible) {
    return 1;
  }
  const nonHash = pairMeta.filter((edge) => edge.source !== 'hash');
  if (nonHash.length === 0) {
    return Math.max(...pairMeta.map((edge) => edge.similarity), 0);
  }
  return Math.max(...nonHash.map((edge) => edge.similarity), 0);
}

export function duplicateSetDisplaySimilarityPercent(input: DuplicateSetDisplayInput): number {
  if (input.bulkArchiveEligible) {
    return 100;
  }
  const raw = input.maxSimilarity * 100;
  return Math.min(99, Math.floor(raw));
}
