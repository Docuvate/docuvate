// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveFolderFromRemotePath } from './resolve-remote-folder.js';

describe('resolveFolderFromRemotePath', () => {
  const folders = [
    {
      id: 'f1',
      name: 'Posteingang',
      parentId: null,
      mappeId: null,
      userId: 'u',
      createdAt: new Date(),
      updatedAt: new Date(),
      documentCount: 0,
    },
    {
      id: 'f2',
      name: 'Büro',
      parentId: 'f1',
      mappeId: null,
      userId: 'u',
      createdAt: new Date(),
      updatedAt: new Date(),
      documentCount: 0,
    },
  ];

  it('maps nested path to child folder', () => {
    expect(resolveFolderFromRemotePath(folders, 'f1', '/Büro/scan.pdf', true)).toBe('f2');
  });

  it('keeps base when mapping disabled', () => {
    expect(resolveFolderFromRemotePath(folders, 'f1', '/Büro/scan.pdf', false)).toBe('f1');
  });
});
