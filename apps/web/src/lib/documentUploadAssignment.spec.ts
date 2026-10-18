// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { resolveFilesystemDropTarget } from './documentUploadAssignment';

const folders: FolderDto[] = [
  {
    id: 'f1',
    name: 'Internet',
    parentId: 'root',
    documentCount: 1,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'root',
    name: 'Haus',
    parentId: null,
    documentCount: 0,
    createdAt: '',
    updatedAt: '',
  },
];

describe('resolveFilesystemDropTarget', () => {
  it('enables upload for folder browse mode', () => {
    const target = resolveFilesystemDropTarget({
      browseMode: 'folder',
      folderId: 'root',
      folders,
    });
    expect(target.enabled).toBe(true);
    expect(target.assignment).toEqual({ kind: 'folder', folderId: 'root', label: 'Haus' });
  });

  it('disables upload for unassigned browse mode', () => {
    const target = resolveFilesystemDropTarget({
      browseMode: 'unassigned',
      folders,
    });
    expect(target.enabled).toBe(false);
  });

  it('honours assignment override', () => {
    const target = resolveFilesystemDropTarget({
      browseMode: 'root',
      folders,
      assignmentOverride: { kind: 'folder', folderId: 'f1', label: 'Custom' },
    });
    expect(target.enabled).toBe(true);
    expect(target.assignment).toEqual({ kind: 'folder', folderId: 'f1', label: 'Custom' });
  });
});
