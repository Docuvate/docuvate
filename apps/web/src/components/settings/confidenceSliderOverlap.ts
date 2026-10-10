// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Returns true when two axis-aligned boxes share interior area. */
export function rectsOverlap(a: DOMRect, b: DOMRect, tolerancePx = 0): boolean {
  return (
    a.left < b.right - tolerancePx &&
    a.right > b.left + tolerancePx &&
    a.top < b.bottom - tolerancePx &&
    a.bottom > b.top + tolerancePx
  );
}

/** Throws when tick or zone label boxes intersect (visible labels only). */
export function assertConfidenceLabelLayout(root: ParentNode): void {
  const nodes = root.querySelectorAll(
    '.confidence-threshold-slider__tick, .confidence-threshold-slider__legend-row, .confidence-threshold-slider__legend-compact-text'
  );
  const rects: DOMRect[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    rects.push(rect);
  }
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (rectsOverlap(rects[i], rects[j], 1)) {
        throw new Error(`confidence slider labels overlap (indices ${String(i)} and ${String(j)})`);
      }
    }
  }
}
