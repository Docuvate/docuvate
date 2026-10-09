// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import {
  folderDirectDocumentCount,
  mappeDirectDocumentCount,
  mappeDocumentCount,
} from './ordnerTree';

describe('ordnerTree document counts', () => {
  it('folderDirectDocumentCount uses direct folder count only', () => {
    const folder: FolderDto = {
      id: 'f1',
      name: 'Haus',
      mappeId: 'm1',
      parentId: null,
      documentCount: 0,
      createdAt: '',
      updatedAt: '',
    };
    expect(folderDirectDocumentCount(folder)).toBe(0);
  });

  it('mappeDocumentCount reflects mappe aggregate including subfolders', () => {
    const mappe: MappeDto = {
      id: 'm1',
      name: 'EHW+',
      documentCount: 4,
      createdAt: '',
      updatedAt: '',
    };
    expect(mappeDocumentCount(mappe)).toBe(4);
  });

  it('mappeDirectDocumentCount subtracts documents stored in folders', () => {
    const mappe: MappeDto = {
      id: 'm1',
      name: 'EHW+',
      documentCount: 3,
      createdAt: '',
      updatedAt: '',
    };
    const folders: FolderDto[] = [
      {
        id: 'f1',
        name: 'Direkt',
        mappeId: 'm1',
        parentId: null,
        documentCount: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];
    expect(mappeDirectDocumentCount(mappe, folders)).toBe(3);
  });
});
