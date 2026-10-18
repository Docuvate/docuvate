// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function smallTalkReply(locale: 'de' | 'en'): string {
  if (locale === 'en') {
    return 'Hello! I can help with questions about your documents and library statistics.';
  }
  return 'Hallo! Ich helfe bei Fragen zu Ihren Dokumenten und einfachen Bibliotheksstatistiken.';
}

export function outOfScopeReply(locale: 'de' | 'en'): string {
  if (locale === 'en') {
    return 'I can only answer questions about your uploaded documents and library metadata.';
  }
  return 'Ich kann nur Fragen zu Ihren hochgeladenen Dokumenten und Bibliotheksdaten beantworten.';
}
