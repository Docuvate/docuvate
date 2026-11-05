// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyThemePreference } from './docuvateTheme';

function stubMatchMedia(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('applyThemePreference', () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-docuvate-theme');
    document.documentElement.removeAttribute('data-docuvate-theme-switching');
  });

  it('suppresses transitions for two frames while the theme changes', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    document.documentElement.setAttribute('data-docuvate-theme', 'light');

    applyThemePreference('dark');
    const root = document.documentElement;
    expect(root.getAttribute('data-docuvate-theme')).toBe('dark');
    expect(root.hasAttribute('data-docuvate-theme-switching')).toBe(true);

    frames.shift()?.(0);
    expect(root.hasAttribute('data-docuvate-theme-switching')).toBe(true);
    frames.shift()?.(16);
    expect(root.hasAttribute('data-docuvate-theme-switching')).toBe(false);
  });

  it('does not toggle the switching flag when the theme is unchanged', () => {
    document.documentElement.setAttribute('data-docuvate-theme', 'dark');
    applyThemePreference('dark');
    expect(document.documentElement.hasAttribute('data-docuvate-theme-switching')).toBe(false);
  });
});
