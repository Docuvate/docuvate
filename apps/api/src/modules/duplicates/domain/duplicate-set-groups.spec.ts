// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
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
});
