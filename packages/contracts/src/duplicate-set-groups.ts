// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface DuplicatePairEdge {
  documentId: string;
  candidateDocumentId: string;
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
