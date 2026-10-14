// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  duplicateSetBulkArchiveEligible,
  duplicateSetDisplaySimilarityPercent,
  duplicateSetIdFromDocumentIds,
  groupDuplicatePairsIntoSets,
  parseDuplicateSetId,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

describe('duplicate-set-groups', () => {
  it('builds stable set ids', () => {
    const id = duplicateSetIdFromDocumentIds(['b', 'a', 'c']);
    expect(id).toBe('a--b--c');
    expect(parseDuplicateSetId(id)).toEqual(['a', 'b', 'c']);
  });

  it('merges transitive pairs into one set', () => {
    const sets = groupDuplicatePairsIntoSets([
      { documentId: 'a', candidateDocumentId: 'b' },
      { documentId: 'b', candidateDocumentId: 'c' },
      { documentId: 'x', candidateDocumentId: 'y' },
    ]);
    expect(sets).toEqual([
      ['a', 'b', 'c'],
      ['x', 'y'],
    ]);
  });

  it('allows bulk archive only for hash-only connected sets', () => {
    const sets = groupDuplicatePairsIntoSets([
      { documentId: 'a', candidateDocumentId: 'b' },
      { documentId: 'b', candidateDocumentId: 'c' },
    ]);
    const setIds = sets[0] ?? [];
    expect(
      duplicateSetBulkArchiveEligible(setIds, [
        { documentId: 'a', candidateDocumentId: 'b', source: 'hash', similarity: 1 },
        { documentId: 'b', candidateDocumentId: 'c', source: 'hash', similarity: 1 },
      ])
    ).toBe(true);
    expect(
      duplicateSetBulkArchiveEligible(setIds, [
        { documentId: 'a', candidateDocumentId: 'b', source: 'embedding', similarity: 0.99 },
      ])
    ).toBe(false);
  });

  it('floors embedding similarity display below 100 %', () => {
    expect(
      duplicateSetDisplaySimilarityPercent({
        bulkArchiveEligible: false,
        maxSimilarity: 0.999,
        sources: ['embedding'],
      })
    ).toBe(99);
  });
});
