// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SiteLocale } from '../lib/routes';
import { docsExtendedDe } from './docs-extended/de';
import { docsExtendedEn } from './docs-extended/en';
import type { DocsExtendedContent } from './docs-extended/types';

export function getDocsExtended(locale: SiteLocale): DocsExtendedContent {
  switch (locale) {
    case 'de':
      return docsExtendedDe;
    case 'en':
      return docsExtendedEn;
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}
