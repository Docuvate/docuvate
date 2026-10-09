// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useSyncExternalStore } from 'react';
import {
  applyTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
  subscribeTheme,
  type DocuvateTheme,
} from './theme';

function subscribe(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const unsubTheme = subscribeTheme(onStoreChange);
  mq.addEventListener('change', onStoreChange);
  return () => {
    unsubTheme();
    mq.removeEventListener('change', onStoreChange);
  };
}

function getSnapshot(): DocuvateTheme {
  return readStoredTheme() ?? resolveTheme();
}

function getServerSnapshot(): DocuvateTheme {
  return 'light';
}

export function useDocuvateTheme(): {
  theme: DocuvateTheme;
  setTheme: (theme: DocuvateTheme) => void;
} {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme = useCallback((next: DocuvateTheme) => {
    persistTheme(next);
  }, []);
  return { theme, setTheme };
}

export function initThemeOnClient(): void {
  applyTheme(getSnapshot());
}
