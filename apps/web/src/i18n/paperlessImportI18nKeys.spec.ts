// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import de from './locales/de.json';
import en from './locales/en.json';

const REQUIRED_PAPERLESS_IMPORT_KEYS = [
  'documentTooLarge',
  'documentFailed',
  'runFailed',
  'runAlreadyActive',
  'retryNoFailedDocuments',
] as const;

describe('connectors.paperlessImport i18n', () => {
  it('defines every API message key in English and German', () => {
    for (const key of REQUIRED_PAPERLESS_IMPORT_KEYS) {
      const enValue = en.connectors.paperlessImport[key];
      const deValue = de.connectors.paperlessImport[key];
      expect(typeof enValue).toBe('string');
      expect(enValue.length).toBeGreaterThan(0);
      expect(typeof deValue).toBe('string');
      expect(deValue.length).toBeGreaterThan(0);
    }
  });
});
