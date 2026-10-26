// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { chipColorStyle } from './chipColorStyle';
import { useDocumentTheme } from './useDocumentTheme';

export function useChipColorStyle(color: string | undefined): CSSProperties | undefined {
  const theme = useDocumentTheme();
  return useMemo(() => chipColorStyle(color, theme), [color, theme]);
}
