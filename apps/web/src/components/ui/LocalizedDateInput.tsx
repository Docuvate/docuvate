// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isoDateToLocalizedDisplay,
  localizedDatePlaceholder,
  localizedDisplayToIsoDate,
  type DocuvateLocale,
} from '../../lib/localizedDate';
import { Input } from './Input';

interface LocalizedDateInputProps {
  value: string;
  onChange: (isoValue: string) => void;
  id?: string;
  'aria-label'?: string;
}

function resolveLocale(language: string): DocuvateLocale {
  return language.startsWith('de') ? 'de' : 'en';
}

export function LocalizedDateInput({
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
}: LocalizedDateInputProps) {
  const { i18n, t } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const placeholder = useMemo(() => localizedDatePlaceholder(locale), [locale]);
  const [display, setDisplay] = useState(() =>
    value ? isoDateToLocalizedDisplay(value, locale) : ''
  );

  useEffect(() => {
    setDisplay(value ? isoDateToLocalizedDisplay(value, locale) : '');
  }, [value, locale]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      aria-label={ariaLabel ?? t('documents.metadataDocumentDate')}
      aria-describedby={id ? `${id}-hint` : undefined}
      value={display}
      onChange={(event) => {
        const nextDisplay = event.target.value;
        setDisplay(nextDisplay);
        const iso = localizedDisplayToIsoDate(nextDisplay, locale);
        if (iso) {
          onChange(iso);
        } else if (!nextDisplay.trim()) {
          onChange('');
        }
      }}
      onBlur={() => {
        const iso = localizedDisplayToIsoDate(display, locale);
        if (iso) {
          onChange(iso);
          setDisplay(isoDateToLocalizedDisplay(iso, locale));
        } else if (!display.trim()) {
          onChange('');
        }
      }}
    />
  );
}
