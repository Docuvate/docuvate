// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  childFolders,
  folderDirectDocumentCount,
  folderSubtreeMatchesSearch,
  pickDefaultFilesystemHref,
} from './ordnerTree';

describe('ordnerTree', () => {
  const folders: FolderDto[] = [
    {
      id: 'root-a',
      name: 'Alpha',
      parentId: null,
      documentCount: 2,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'root-b',
      name: 'Beta',
      parentId: null,
      documentCount: 0,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'child-a1',
      name: 'Nested',
      parentId: 'root-a',
      documentCount: 1,
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('childFolders returns direct children sorted by German locale', () => {
    expect(childFolders(folders, null).map((f) => f.id)).toEqual(['root-a', 'root-b']);
    expect(childFolders(folders, 'root-a').map((f) => f.id)).toEqual(['child-a1']);
  });

  it('folderDirectDocumentCount uses direct folder count only', () => {
    expect(folderDirectDocumentCount(folders[0])).toBe(2);
  });

  it('pickDefaultFilesystemHref prefers first root folder', () => {
    expect(pickDefaultFilesystemHref(folders)).toBe('/filesystem/folders/root-a');
    expect(pickDefaultFilesystemHref([])).toBeNull();
  });

  it('folderSubtreeMatchesSearch matches descendants', () => {
    expect(folderSubtreeMatchesSearch(folders, 'root-a', 'nested')).toBe(true);
    expect(folderSubtreeMatchesSearch(folders, 'root-b', 'nested')).toBe(false);
  });
});
