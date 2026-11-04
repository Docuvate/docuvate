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
