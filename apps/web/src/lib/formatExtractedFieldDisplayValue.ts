// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const AMOUNT_KEYS = new Set(['amount', 'total', 'betrag', 'summe', 'brutto', 'bruttobetrag']);

function parseStoredAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatExtractedFieldDisplayValue(
  key: string,
  value: string,
  locale: string
): string {
  if (!value.trim()) return '-';
  const normalizedKey = key.trim().toLowerCase();
  if (!AMOUNT_KEYS.has(normalizedKey)) {
    return value;
  }
  const amount = parseStoredAmount(value);
  if (amount == null) {
    return value;
  }
  if (locale.startsWith('de')) {
    const number = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${number} EUR`;
  }
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `EUR ${number}`;
}
