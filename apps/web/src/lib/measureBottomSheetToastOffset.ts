// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const BOTTOM_SHEET_SELECTOR = '.bottom-sheet-panel[role="dialog"]';

/** How far a toast must lift so its bottom edge sits 16px above the tallest open sheet. */
export function measureBottomSheetToastOffset(
  root?: ParentNode,
  viewportHeight?: number
): number {
  if (typeof document === 'undefined') {
    return 0;
  }
  const scope = root ?? document;
  const viewHeight =
    viewportHeight ?? (typeof window === 'undefined' ? 0 : window.innerHeight);
  let offset = 0;
  const sheets = scope.querySelectorAll(BOTTOM_SHEET_SELECTOR);
  sheets.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const box = node.getBoundingClientRect();
    if (box.height <= 0 || box.width <= 0) {
      return;
    }
    const fromBottom = Math.max(0, viewHeight - box.top);
    if (fromBottom > offset) {
      offset = fromBottom;
    }
  });
  return Math.round(offset);
}
