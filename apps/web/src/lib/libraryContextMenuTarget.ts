// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

export function resolveContextMenuSelectedIds(
  documentId: string,
  selected: ReadonlySet<string>
): string[] {
  if (selected.has(documentId) && selected.size > 0) {
    return [...selected];
  }
  return [documentId];
}

export function contextMenuTitleForSelection(
  selectedIds: string[],
  items: DocumentDto[],
  labels: { singleFallback: string; multiple: (count: number) => string }
): string {
  if (selectedIds.length === 1) {
    const doc = items.find((item) => item.id === selectedIds[0]);
    return doc?.title.trim() ?? labels.singleFallback;
  }
  return labels.multiple(selectedIds.length);
}

export interface ViewportRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function computeRowAnchoredMenuPosition(
  anchorRect: ViewportRect,
  pointerX: number,
  menuWidth: number,
  menuHeight: number,
  viewport: { width: number; height: number },
  pad = 8
): { left: number; top: number } {
  let left = pointerX;
  let top = anchorRect.top;

  if (left + menuWidth > viewport.width - pad) {
    left = Math.max(pad, viewport.width - menuWidth - pad);
  }
  if (left < pad) {
    left = pad;
  }
  if (top + menuHeight > viewport.height - pad) {
    top = Math.max(pad, viewport.height - menuHeight - pad);
  }
  if (top < pad) {
    top = pad;
  }

  return { left, top };
}

/** Reserved bulk toolbar height (must match `.bulk-bar-slot` in app.css). */
export const LIBRARY_BULK_BAR_SLOT_MIN_HEIGHT = '2.75rem';
