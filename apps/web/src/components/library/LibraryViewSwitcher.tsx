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
}

export function LibraryViewSwitcher({ value, onChange, variant = 'default' }: LibraryViewSwitcherProps) {
  const { t } = useTranslation();
  const modes = useMemo(
    () =>
      [
        { value: 'klassisch' as const, label: t('library.viewClassic') },
        { value: 'karten' as const, label: t('library.viewCards') },
        { value: 'fokus' as const, label: t('library.viewFocus') },
      ] as const,
    [t]
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
