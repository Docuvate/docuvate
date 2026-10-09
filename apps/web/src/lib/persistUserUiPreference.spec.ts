// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistUserUiPreference } from './persistUserUiPreference';
import { updateUserSettings } from './api';
import { applyThemePreference } from './docuvateTheme';
import { notifySaved } from './saveNotify';
import i18n, { LOCALE_STORAGE_KEY } from '../i18n';

vi.mock('./api', () => ({
  updateUserSettings: vi.fn(),
}));

vi.mock('./docuvateTheme', () => ({
  applyThemePreference: vi.fn(),
}));

vi.mock('./saveNotify', () => ({
  notifySaved: vi.fn(),
}));

describe('persistUserUiPreference', () => {
  beforeEach(() => {
    vi.mocked(updateUserSettings).mockReset();
    vi.mocked(applyThemePreference).mockReset();
    vi.mocked(notifySaved).mockReset();
    window.localStorage.clear();
    void i18n.changeLanguage('de');
  });

  it('notifies saved after a successful theme preference save', async () => {
    vi.mocked(updateUserSettings).mockResolvedValue(undefined);
    const result = await persistUserUiPreference({
      kind: 'theme',
      next: 'dark',
      previous: 'light',
    });
    expect(result).toEqual({ ok: true });
    expect(applyThemePreference).toHaveBeenCalledWith('dark');
    expect(notifySaved).toHaveBeenCalledOnce();
  });

  it('rolls back theme preference without a saved toast when the API fails', async () => {
    vi.mocked(updateUserSettings).mockRejectedValue(new Error('network'));
    const result = await persistUserUiPreference({
      kind: 'theme',
      next: 'dark',
      previous: 'light',
    });
    expect(result.ok).toBe(false);
    expect(applyThemePreference).toHaveBeenCalledWith('light');
    expect(notifySaved).not.toHaveBeenCalled();
  });

  it('notifies saved after a successful locale save', async () => {
    vi.mocked(updateUserSettings).mockResolvedValue(undefined);
    const result = await persistUserUiPreference({
      kind: 'locale',
      next: 'en',
      previous: 'de',
    });
    expect(result).toEqual({ ok: true });
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(notifySaved).toHaveBeenCalledOnce();
  });

  it('rolls back locale without a saved toast when the API fails', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    void i18n.changeLanguage('de');
    vi.mocked(updateUserSettings).mockRejectedValue(new Error('network'));
    const result = await persistUserUiPreference({
      kind: 'locale',
      next: 'en',
      previous: 'de',
    });
    expect(result.ok).toBe(false);
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('de');
    expect(i18n.language).toMatch(/^de/);
    expect(notifySaved).not.toHaveBeenCalled();
  });
});
