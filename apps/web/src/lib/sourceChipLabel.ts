// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function sourceChipPageLabel(page: number, locale: string): string {
  const language = locale.toLowerCase().startsWith('de') ? 'de' : 'en';
  if (language === 'de') {
    return `Seite ${String(page)}`;
  }
  return `Page ${String(page)}`;
}

export function sourceChipFullLabel(
  page: number,
  locale: string,
  regionLabel?: string
): string {
  const pageLabel = sourceChipPageLabel(page, locale);
  const extra = regionLabel?.trim();
  if (!extra) {
    return pageLabel;
  }
  return `${pageLabel} · ${extra}`;
}
