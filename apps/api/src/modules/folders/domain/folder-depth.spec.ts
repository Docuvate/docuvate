// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { folderDepth, maxSubtreeDepth } from './folder-depth.js';

describe('folder-depth', () => {
  const folders = [
    { id: 'a', parentId: null },
    { id: 'b', parentId: 'a' },
    { id: 'c', parentId: 'b' },
    { id: 'd', parentId: 'c' },
  ];

  it('measures depth from root', () => {
    expect(folderDepth(folders, 'a')).toBe(1);
    expect(folderDepth(folders, 'c')).toBe(3);
    expect(folderDepth(folders, 'd')).toBe(4);
  });

  it('measures subtree span', () => {
    expect(maxSubtreeDepth(folders, 'a')).toBe(4);
    expect(maxSubtreeDepth(folders, 'b')).toBe(3);
  });
});
