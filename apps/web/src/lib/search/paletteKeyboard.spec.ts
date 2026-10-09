// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { movePaletteGroupTab, movePaletteSelection } from './paletteKeyboard';

const items = [
  { groupIndex: 0, itemIndex: 0, id: 'a' },
  { groupIndex: 0, itemIndex: 1, id: 'b' },
  { groupIndex: 1, itemIndex: 0, id: 'c' },
];

describe('paletteKeyboard', () => {
  it('cycles selection with arrows', () => {
    expect(movePaletteSelection(items, 'a', 'next')).toBe('b');
    expect(movePaletteSelection(items, 'c', 'next')).toBe('a');
  });

  it('jumps groups with tab navigation helper', () => {
    expect(movePaletteGroupTab(items, 'b', 'next')).toBe('c');
    expect(movePaletteGroupTab(items, 'c', 'prev')).toBe('a');
  });
});
