// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ThemePreference } from '@docuvate/contracts';
import { type DocuvateTheme,docuvateThemeAttribute } from '@docuvate/tokens';

import {
  COMPACT_THEME_STORAGE_KEY,
  notifyThemePreferenceChange,
  readStoredThemePreference,
  readSystemPrefersDark,
  resolveThemeFromPreference,
  THEME_PREFERENCE_CHANGE_EVENT,
  THEME_PREFERENCE_STORAGE_KEY,
} from './themePreference';

let systemMediaQuery: MediaQueryList | null = null;
let systemListenerAttached = false;

function applyResolvedTheme(resolved: DocuvateTheme): void {
  document.documentElement.setAttribute(docuvateThemeAttribute, resolved);
  window.localStorage.setItem(COMPACT_THEME_STORAGE_KEY, resolved);
}

export function readResolvedTheme(): DocuvateTheme {
  const preference = readStoredThemePreference();
  return resolveThemeFromPreference(preference, readSystemPrefersDark());
}

export function applyThemePreference(preference: ThemePreference): void {
  window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  applyResolvedTheme(resolveThemeFromPreference(preference, readSystemPrefersDark()));
  notifyThemePreferenceChange();
}

function attachSystemPreferenceListener(): void {
  if (systemListenerAttached || typeof window === 'undefined') {
    return;
  }
  systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (readStoredThemePreference() !== 'system') {
      return;
    }
    applyResolvedTheme(resolveThemeFromPreference('system', readSystemPrefersDark()));
    notifyThemePreferenceChange();
  };
  systemMediaQuery.addEventListener('change', onChange);
  systemListenerAttached = true;
}

export function initDocuvateTheme(): DocuvateTheme {
  const preference = readStoredThemePreference();
  applyResolvedTheme(resolveThemeFromPreference(preference, readSystemPrefersDark()));
  attachSystemPreferenceListener();
  return readResolvedTheme();
}

export function subscribeThemeStore(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [docuvateThemeAttribute],
  });
  const onPreferenceEvent = () => { onStoreChange(); };
  window.addEventListener(THEME_PREFERENCE_CHANGE_EVENT, onPreferenceEvent);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMedia = () => { onStoreChange(); };
  media.addEventListener('change', onMedia);
  return () => {
    observer.disconnect();
    window.removeEventListener(THEME_PREFERENCE_CHANGE_EVENT, onPreferenceEvent);
    media.removeEventListener('change', onMedia);
  };
}

export function getThemePreferenceSnapshot(): ThemePreference {
  return readStoredThemePreference();
}

export function getResolvedThemeSnapshot(): DocuvateTheme {
  const attr = document.documentElement.getAttribute(docuvateThemeAttribute);
  if (attr === 'light' || attr === 'dark') {
    return attr;
  }
  return readResolvedTheme();
}
