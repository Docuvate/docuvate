// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface PaletteItemRef {
  groupIndex: number;
  itemIndex: number;
  id: string;
}

export function movePaletteSelection(
  items: PaletteItemRef[],
  activeId: string | null,
  direction: 'next' | 'prev'
): string | null {
  if (items.length === 0) return null;
  const idx = activeId ? items.findIndex((i) => i.id === activeId) : -1;
  if (idx < 0) return items[0].id;
  const delta = direction === 'next' ? 1 : -1;
  const next = (idx + delta + items.length) % items.length;
  return items[next].id;
}

export function movePaletteGroupTab(
  items: PaletteItemRef[],
  activeId: string | null,
  direction: 'next' | 'prev'
): string | null {
  if (items.length === 0) return null;
  const current = activeId ? items.findIndex((i) => i.id === activeId) : 0;
  const group = current >= 0 ? items[current].groupIndex : 0;
  const groups = [...new Set(items.map((i) => i.groupIndex))].sort((a, b) => a - b);
  const gi = groups.indexOf(group);
  const nextGi = (gi + (direction === 'next' ? 1 : -1) + groups.length) % groups.length;
  const targetGroup = groups[nextGi];
  const firstInGroup = items.find((i) => i.groupIndex === targetGroup);
  return firstInGroup?.id ?? items[0].id;
}
