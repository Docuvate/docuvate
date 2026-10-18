// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { wouldCreateFolderCycle } from './folder-cycle.js';

describe('wouldCreateFolderCycle', () => {
  const tree = [
    { id: 'a', parentId: null },
    { id: 'b', parentId: 'a' },
    { id: 'c', parentId: 'b' },
  ];

  it('detects self-parent', () => {
    expect(wouldCreateFolderCycle(tree, 'b', 'b')).toBe(true);
  });

  it('detects moving a node under its descendant', () => {
    expect(wouldCreateFolderCycle(tree, 'a', 'c')).toBe(true);
  });

  it('allows valid reparent', () => {
    expect(wouldCreateFolderCycle(tree, 'c', 'a')).toBe(false);
  });
});
