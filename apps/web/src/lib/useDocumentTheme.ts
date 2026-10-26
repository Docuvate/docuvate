// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocuvateTheme } from '@docuvate/tokens';
import { useSyncExternalStore } from 'react';

import { readDocumentTheme } from './themePalette';

const THEME_ATTR = 'data-docuvate-theme';

function subscribeTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(() => {
    onStoreChange();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTR],
  });
  return () => {
    observer.disconnect();
  };
}

export function useDocumentTheme(): DocuvateTheme {
  return useSyncExternalStore(subscribeTheme, readDocumentTheme, () => 'light');
}
