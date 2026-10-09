// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ThemePreference, UiLocale } from '@docuvate/contracts';
import { updateUserSettings } from './api';
import { formatUserFacingError } from './apiErrors';
import { applyThemePreference } from './docuvateTheme';
import { notifySaved } from './saveNotify';
import i18n, { LOCALE_STORAGE_KEY } from '../i18n';

type PersistPatch =
  | { kind: 'theme'; next: ThemePreference; previous: ThemePreference }
  | { kind: 'locale'; next: UiLocale; previous: UiLocale };

export async function persistUserUiPreference(
  patch: PersistPatch
): Promise<{ ok: true } | { ok: false; message: string; rolledBack: PersistPatch }> {
  if (patch.kind === 'theme') {
    applyThemePreference(patch.next);
    try {
      await updateUserSettings({ themePreference: patch.next });
      notifySaved();
      return { ok: true };
    } catch (err) {
      applyThemePreference(patch.previous);
      return {
        ok: false,
        message: formatUserFacingError(err, 'shell.uiPreferenceSaveFailed'),
        rolledBack: patch,
      };
    }
  }

  void i18n.changeLanguage(patch.next);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, patch.next);
  try {
    await updateUserSettings({ locale: patch.next });
    notifySaved();
    return { ok: true };
  } catch (err) {
    void i18n.changeLanguage(patch.previous);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, patch.previous);
    return {
      ok: false,
      message: formatUserFacingError(err, 'shell.uiPreferenceSaveFailed'),
      rolledBack: patch,
    };
  }
}
