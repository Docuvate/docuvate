// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ThemePreference } from '@docuvate/contracts';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { segmentedPreferenceClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SegmentedIconLabel } from '../ui/SegmentedIconLabel';

const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

export function ThemePreferencePicker({
  value,
  onChange,
  firstOptionRef,
}: {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  firstOptionRef?: MutableRefObject<HTMLButtonElement | null>;
}) {
  const { t } = useTranslation();

  const labelFor = (preference: ThemePreference) => {
    switch (preference) {
      case 'light':
        return t('shell.themeSegmentLight');
      case 'dark':
        return t('shell.themeSegmentDark');
      case 'system':
        return t('shell.themeSegmentSystem');
      default: {
        const _exhaustive: never = preference;
        return _exhaustive;
      }
    }
  };

  const iconFor = (preference: ThemePreference) => {
    switch (preference) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default: {
        const _exhaustive: never = preference;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="user-account-menu-theme">
      <span className="user-account-menu-theme-label" id="user-account-menu-theme-label">
        {t('shell.themeAppearance')}
      </span>
      <SegmentedControl<ThemePreference>
        ariaLabel={t('shell.themeAppearance')}
        className={segmentedPreferenceClass(
          'segmented-control--icon-label',
          'segmented-control--menu-block'
        )}
        value={value}
        firstOptionRef={firstOptionRef}
        options={OPTIONS.map((preference) => ({
          value: preference,
          label: <SegmentedIconLabel Icon={iconFor(preference)} label={labelFor(preference)} />,
        }))}
        onChange={onChange}
      />
    </div>
  );
}
