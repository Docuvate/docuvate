// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** BCP 47 language of the document element for the active UI locale. */
export function documentLanguageForLocale(language: string): 'de' | 'en' {
  return language.toLowerCase().startsWith('en') ? 'en' : 'de';
}

export function applyDocumentLanguage(language: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = documentLanguageForLocale(language);
}
