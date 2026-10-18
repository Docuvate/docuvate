// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { docuvateThemeAttribute } from '@docuvate/tokens';

export type DocuvateTheme = 'light' | 'dark';

const STORAGE_KEY = 'docuvate-site-theme';

export function readStoredTheme(): DocuvateTheme | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

export function resolveTheme(): DocuvateTheme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: DocuvateTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(docuvateThemeAttribute, theme);
}

const themeListeners = new Set<() => void>();

export function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

export function persistTheme(theme: DocuvateTheme): void {
  applyTheme(theme);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, theme);
    themeListeners.forEach((listener) => listener());
  }
}
