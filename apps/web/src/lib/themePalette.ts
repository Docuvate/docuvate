// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { tokens, type DocuvateTheme } from '@docuvate/tokens';

export function themePalette(theme: DocuvateTheme = 'light') {
  return theme === 'dark' ? tokens.colorDark : tokens.colorLight;
}

export function readDocumentTheme(): DocuvateTheme {
  if (typeof document === 'undefined') {
    return 'light';
  }
  const attr = document.documentElement.getAttribute('data-docuvate-theme');
  return attr === 'dark' ? 'dark' : 'light';
}
