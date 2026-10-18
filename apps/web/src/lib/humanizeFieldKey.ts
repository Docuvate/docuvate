// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

function titleCaseWords(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function splitFieldKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
}

/** Localized label for extraction field keys not covered by schema / recognized fields. */
export function humanizeFieldKey(key: string, t: TFunction): string {
  const trimmed = key.trim();
  if (!trimmed) return trimmed;
  const i18nKey = `documents.fieldKey.${trimmed}`;
  const translated = t(i18nKey, { defaultValue: '' });
  if (translated) return translated;
  return titleCaseWords(splitFieldKey(trimmed));
}
