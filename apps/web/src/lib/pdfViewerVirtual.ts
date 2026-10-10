// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const PDF_VIRTUAL_WINDOW_RADIUS = 2;

export function computeVirtualPageWindow(
  anchorPages: Iterable<number>,
  pageCount: number,
  radius = PDF_VIRTUAL_WINDOW_RADIUS
): Set<number> {
  const window = new Set<number>();
  for (const page of anchorPages) {
    const p = Math.round(page);
    if (p < 1 || p > pageCount) continue;
    for (let i = p - radius; i <= p + radius; i += 1) {
      if (i >= 1 && i <= pageCount) window.add(i);
    }
  }
  if (window.size === 0 && pageCount > 0) {
    for (let i = 1; i <= Math.min(pageCount, radius * 2 + 1); i += 1) {
      window.add(i);
    }
  }
  return window;
}

export function layoutOverlayPercentStyles(
  overlay: { x: number; y: number; width: number; height: number }
): { left: string; top: string; width: string; height: string } {
  return {
    left: `${overlay.x * 100}%`,
    top: `${overlay.y * 100}%`,
    width: `${Math.max(overlay.width * 100, 0.4)}%`,
    height: `${Math.max(overlay.height * 100, 0.35)}%`,
  };
}
