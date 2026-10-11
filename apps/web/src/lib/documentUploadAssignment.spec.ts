// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { resolveFilesystemDropTarget } from './documentUploadAssignment';

const mappen: MappeDto[] = [
  { id: 'm1', name: 'EHW+', documentCount: 0, createdAt: '', updatedAt: '' },
];
const folders: FolderDto[] = [
  {
    id: 'f1',
    name: 'Internet',
    mappeId: 'm2',
    parentId: null,
    documentCount: 1,
    createdAt: '',
    updatedAt: '',
  },
];

describe('resolveFilesystemDropTarget', () => {
  it('enables upload for folder browse mode', () => {
    const ehFolder: FolderDto = {
      id: 'ehw',
      name: 'EHW+',
      mappeId: 'm1',
      parentId: null,
      documentCount: 0,
      createdAt: '',
      updatedAt: '',
    };
    const target = resolveFilesystemDropTarget({
      browseMode: 'folder',
      folderId: 'ehw',
      folders: [...folders, ehFolder],
      mappen,
    });
    expect(target.enabled).toBe(true);
    expect(target.assignment).toEqual({ kind: 'folder', folderId: 'ehw', label: 'EHW+' });
  });

  it('enables mappe upload when mappe has no child folders', () => {
    const target = resolveFilesystemDropTarget({
      browseMode: 'mappe',
      mappeId: 'm1',
      folders: [],
      mappen,
    });
    expect(target.enabled).toBe(true);
    expect(target.assignment).toEqual({ kind: 'mappe', mappeId: 'm1', label: 'EHW+' });
  });

  it('targets the mappe when browsing a container with child folders', () => {
    const withRoots: FolderDto[] = [
      {
        id: 'r1',
        name: 'Haus',
        mappeId: 'm1',
        parentId: null,
        documentCount: 0,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'r2',
        name: 'B',
        mappeId: 'm1',
        parentId: null,
        documentCount: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const target = resolveFilesystemDropTarget({
      browseMode: 'mappe',
      mappeId: 'm1',
      folders: withRoots,
      mappen,
    });
    expect(target.enabled).toBe(true);
    expect(target.assignment).toEqual({ kind: 'mappe', mappeId: 'm1', label: 'EHW+' });
  });
});
