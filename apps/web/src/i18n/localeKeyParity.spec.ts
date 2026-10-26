// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import de from './locales/de.json';
import en from './locales/en.json';
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectLeafKeys(value: unknown, prefix = ''): string[] {
  if (!isPlainRecord(value)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const key of Object.keys(value).sort()) {
    const path = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (isPlainRecord(child)) {
      keys.push(...collectLeafKeys(child, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('locale key parity', () => {
  it('de.json and en.json expose the same key set', () => {
    const deKeys = collectLeafKeys(de).sort();
    const enKeys = collectLeafKeys(en).sort();
    expect(deKeys).toEqual(enKeys);
  });
});
