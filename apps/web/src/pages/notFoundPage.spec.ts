// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import i18n from '../i18n';

describe('notFoundPage i18n', () => {
  it('provides German and English copy with documents link label', async () => {
    await i18n.changeLanguage('de');
    expect(i18n.t('notFoundPage.title')).toBe('Seite nicht gefunden');
    expect(i18n.t('notFoundPage.documentsLink')).toBe('Zu den Dokumenten');

    await i18n.changeLanguage('en');
    expect(i18n.t('notFoundPage.title')).toBe('Page not found');
    expect(i18n.t('notFoundPage.documentsLink')).toBe('Go to Documents');
  });
});
