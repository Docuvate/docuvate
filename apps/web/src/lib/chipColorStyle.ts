// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocuvateTheme } from '@docuvate/tokens';
import type { CSSProperties } from 'react';

import { resolveChipColors } from './chipContrast';
import { readDocumentTheme } from './themePalette';

type ChipCssVariables = CSSProperties & {
  '--chip-bg': string;
  '--chip-fg': string;
};

/** Maps a label hex color to chip CSS variables with readable foreground. */
export function chipColorStyle(
  color: string | undefined,
  theme?: DocuvateTheme
): ChipCssVariables | undefined {
  if (!color) return undefined;
  const resolvedTheme = theme ?? readDocumentTheme();
  const resolved = resolveChipColors(color, resolvedTheme);
  if (!resolved) return undefined;
  const style: ChipCssVariables = {
    '--chip-bg': resolved.background,
    '--chip-fg': resolved.foreground,
  };
  return style;
}
