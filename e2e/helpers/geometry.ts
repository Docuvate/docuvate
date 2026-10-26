// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export function rectsOverlap(a: Rect, b: Rect, gap = 0): boolean {
  const separatedHorizontally = a.right + gap <= b.left || b.right + gap <= a.left;
  const separatedVertically = a.bottom + gap <= b.top || b.bottom + gap <= a.top;
  return !(separatedHorizontally || separatedVertically);
}

export function domRectToRect(rect: DOMRect): Rect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}
