// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isRecord } from '../lib/apiErrors';
import de from './locales/de.json';
import en from './locales/en.json';

/** Single-brace `{name}` that is not part of i18next `{{name}}`. */
const UNRESOLVED_PLACEHOLDER = /(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/g;

function collectLeafPaths(value: unknown, prefix = ''): { path: string; text: string }[] {
  if (typeof value === 'string') {
    return prefix ? [{ path: prefix, text: value }] : [];
  }
  if (!isRecord(value)) {
    return [];
  }
  const out: { path: string; text: string }[] = [];
  for (const key of Object.keys(value).sort()) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.push(...collectLeafPaths(value[key], path));
  }
  return out;
}

function findUnresolved(
  localeName: string,
  root: unknown
): { locale: string; path: string; match: string }[] {
  const offenders: { locale: string; path: string; match: string }[] = [];
  for (const { path, text } of collectLeafPaths(root)) {
    for (const match of text.matchAll(UNRESOLVED_PLACEHOLDER)) {
      offenders.push({ locale: localeName, path, match: match[0] });
    }
  }
  return offenders;
}

describe('locale interpolation placeholders', () => {
  it('has no unresolved single-brace placeholders in en.json or de.json', () => {
    const offenders = [...findUnresolved('en', en), ...findUnresolved('de', de)];
    expect(offenders).toEqual([]);
  });
});
