import { useCallback, useSyncExternalStore } from 'react';
import type { DocuvateTheme } from '@docuvate/tokens';
import type { ThemePreference } from '@docuvate/contracts';
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
    () => 'system' as ThemePreference
  );
  const theme = useSyncExternalStore(
    subscribeThemeStore,
    getResolvedThemeSnapshot,
    () => 'light' as DocuvateTheme
  );

  const setThemePreference = useCallback((next: ThemePreference) => {
    applyThemePreference(next);
  }, []);

  const setTheme = useCallback(
    (next: DocuvateTheme) => {
      applyThemePreference(next);
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return { theme, themePreference, setTheme, setThemePreference, toggleTheme };
}
