// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CSSProperties } from 'react';

export function treeDepthStyle(depth: number): CSSProperties & { '--tree-depth': string } {
  return { '--tree-depth': String(depth) };
}

export function confidenceThresholdTrackStyle(
  fillPercent: number,
  thumbColor: string
): CSSProperties & { '--confidence-fill': string; '--confidence-thumb': string } {
  return {
    '--confidence-fill': `${String(fillPercent)}%`,
    '--confidence-thumb': thumbColor,
  };
}

export function dateisystemSidebarWidthStyle(
  widthPx: number
): CSSProperties & { '--dateisystem-sidebar-width': string } {
  return { '--dateisystem-sidebar-width': `${String(widthPx)}px` };
}
