// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { folderDocumentCountsFor, folderDocumentCountsWithSubfolders } from './ordnerTree';

function folder(id: string, parentId: string | null, documentCount: number): FolderDto {
  return {
    id,
    name: id,
    parentId,
    documentCount,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('folderDocumentCountsWithSubfolders', () => {
  it('adds documents of all subfolders to each parent', () => {
    const counts = folderDocumentCountsWithSubfolders([
      folder('root', null, 0),
      folder('a', 'root', 4),
      folder('a1', 'a', 50),
      folder('b', 'root', 0),
    ]);
    expect(counts.get('root')).toEqual({ total: 54, direct: 0 });
    expect(counts.get('a')).toEqual({ total: 54, direct: 4 });
    expect(counts.get('a1')).toEqual({ total: 50, direct: 50 });
    expect(counts.get('b')).toEqual({ total: 0, direct: 0 });
  });

  it('terminates on a parent cycle', () => {
    const counts = folderDocumentCountsWithSubfolders([folder('x', 'y', 1), folder('y', 'x', 2)]);
    expect(counts.get('x')?.direct).toBe(1);
    expect(counts.get('y')?.direct).toBe(2);
  });

  it('falls back to the direct count for unknown folders', () => {
    expect(folderDocumentCountsFor(new Map(), folder('z', null, 3))).toEqual({
      total: 3,
      direct: 3,
    });
  });
});
