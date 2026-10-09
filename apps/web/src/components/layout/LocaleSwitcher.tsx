// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UiLocale } from '@docuvate/contracts';
import { authClient } from '../../lib/auth-client';
import { LOCALE_STORAGE_KEY } from '../../i18n';
import { persistUserUiPreference } from '../../lib/persistUserUiPreference';
import { segmentedPreferenceClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';

const LOCALE_CODES: UiLocale[] = ['de', 'en'];

/**
 * Language picker placement (one surface per viewport):
 * - Desktop (≥769px): `topbar` only (`AppShell`, not in avatar menu).
 * - Mobile (≤768px): `menu` only (`UserAccountMenu`, not in topbar).
 */
export function LocaleSwitcher({ placement = 'topbar' }: { placement?: 'topbar' | 'menu' }) {
  const { i18n, t } = useTranslation();
  const { data: session } = authClient.useSession();
  const [saveError, setSaveError] = useState<string | null>(null);
  const current: UiLocale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'de';

  const options = useMemo(
    () =>
      LOCALE_CODES.map((code) => ({
        value: code,
        label: t(code === 'de' ? 'shell.languageDe' : 'shell.languageEn'),
      })),
    [t]
  );

  async function setLocale(code: UiLocale) {
    if (code === current) {
      return;
    }
    setSaveError(null);
    const previous = current;
    if (!session?.user?.id) {
      void i18n.changeLanguage(code);
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      return;
    }
    const result = await persistUserUiPreference({
      kind: 'locale',
      next: code,
      previous,
    });
    if (!result.ok) {
      setSaveError(result.message);
    }
  }

  return (
    <div
      className={`locale-switcher-wrap${placement === 'topbar' ? ' locale-switcher-wrap--topbar' : ' locale-switcher-wrap--menu'}`}
    >
      {placement === 'menu' ? (
        <span className="user-account-menu-theme-label">{t('shell.language')}</span>
      ) : null}
      <SegmentedControl<UiLocale>
        ariaLabel={t('shell.language')}
        className={segmentedPreferenceClass(
          'segmented-control--text',
          placement === 'menu' ? 'segmented-control--menu-block' : ''
        )}
        value={current}
        options={options}
        onChange={(code) => void setLocale(code)}
      />
      {saveError ? (
        <p className="locale-switcher-error" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
