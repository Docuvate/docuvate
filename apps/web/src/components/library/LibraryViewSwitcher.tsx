// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Focus, LayoutGrid, List, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { LibraryViewMode } from '../../lib/libraryViewMode';
import { segmentedPreferenceClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';

interface LibraryViewSwitcherProps {
  value: LibraryViewMode;
  onChange: (mode: LibraryViewMode) => void;
  /** Segmented control without outer border stretch (filesystem toolbar). */
  variant?: 'default' | 'segmented';
  /** Icon before each label; the label may collapse on narrow ribbons, the name stays. */
  withIcons?: boolean;
}

const MODE_ICONS: Record<LibraryViewMode, LucideIcon> = {
  klassisch: List,
  karten: LayoutGrid,
  fokus: Focus,
};

export function LibraryViewSwitcher({
  value,
  onChange,
  variant = 'default',
  withIcons = false,
}: LibraryViewSwitcherProps) {
  const { t } = useTranslation();
  const modes = useMemo(
    () =>
      (
        [
          { value: 'klassisch', label: t('library.viewClassic') },
          { value: 'karten', label: t('library.viewCards') },
          { value: 'fokus', label: t('library.viewFocus') },
        ] as const
      ).map((mode) => {
        if (!withIcons) return mode;
        const Icon = MODE_ICONS[mode.value];
        return {
          value: mode.value,
          label: (
            <span className="segmented-option-content" title={mode.label}>
              <Icon size={15} strokeWidth={1.75} aria-hidden />
              <span className="segmented-option-label">{mode.label}</span>
            </span>
          ),
        };
      }),
    [t, withIcons]
  );

  return (
    <SegmentedControl<LibraryViewMode>
      ariaLabel={t('library.viewAria')}
      className={segmentedPreferenceClass(
        'segmented-control--text',
        variant === 'segmented' ? 'library-view-switcher-segmented' : ''
      )}
      value={value}
      options={[...modes]}
      onChange={onChange}
    />
  );
}
