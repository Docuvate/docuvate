// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ThemePreference } from '@docuvate/contracts';
import type { DocuvateTheme } from '@docuvate/tokens';
import { useCallback, useSyncExternalStore } from 'react';

import {
  applyThemePreference,
  getResolvedThemeSnapshot,
  getThemePreferenceSnapshot,
  subscribeThemeStore,
} from './docuvateTheme';

export function useDocuvateTheme(): {
  theme: DocuvateTheme;
  themePreference: ThemePreference;
  setTheme: (theme: DocuvateTheme) => void;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
} {
  const themePreference = useSyncExternalStore(
    subscribeThemeStore,
    getThemePreferenceSnapshot,
    (): ThemePreference => 'system'
  );
  const theme = useSyncExternalStore(
    subscribeThemeStore,
    getResolvedThemeSnapshot,
    (): DocuvateTheme => 'light'
  );

  const setThemePreference = useCallback((next: ThemePreference) => {
    applyThemePreference(next);
  }, []);

  const setTheme = useCallback((next: DocuvateTheme) => {
    applyThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return { theme, themePreference, setTheme, setThemePreference, toggleTheme };
}
