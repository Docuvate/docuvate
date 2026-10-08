import type { ThemePreference } from '@docuvate/contracts';

export const THEME_PREFERENCE_STORAGE_KEY = 'docuvate-theme-preference';
/** Resolved light/dark value kept for older localStorage readers. */
export const COMPACT_THEME_STORAGE_KEY = 'docuvate-theme';

export const THEME_PREFERENCE_CHANGE_EVENT = 'docuvate-theme-preference-change';

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveThemeFromPreference(
  preference: ThemePreference,
  prefersDark: boolean
): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return prefersDark ? 'dark' : 'light';
}

export function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  if (isThemePreference(stored)) {
    return stored;
  }
  const compact = window.localStorage.getItem(COMPACT_THEME_STORAGE_KEY);
  if (compact === 'light' || compact === 'dark') {
    return compact;
  }
  return 'system';
}

export function notifyThemePreferenceChange(): void {
  window.dispatchEvent(new CustomEvent(THEME_PREFERENCE_CHANGE_EVENT));
}
