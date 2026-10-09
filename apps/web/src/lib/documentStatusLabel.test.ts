// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import de from '../i18n/locales/de.json';
import en from '../i18n/locales/en.json';
import { documentStatusValues } from './documentStatusLabel';

describe('library.status i18n', () => {
  it('defines a label for every DocumentStatus in de and en', () => {
    for (const status of documentStatusValues) {
      expect(de.library.status[status as keyof typeof de.library.status]).toBeTruthy();
      expect(en.library.status[status as keyof typeof en.library.status]).toBeTruthy();
    }
  });
});
