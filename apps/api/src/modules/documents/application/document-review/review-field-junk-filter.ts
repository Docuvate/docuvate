// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseSuggestionStorageKey } from '@docuvate/contracts';

function normalizeComparable(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isZeroAmount(value: string): boolean {
  const compact = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(compact.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) && parsed === 0;
}

export function isJunkReviewFieldSuggestion(input: {
  key: string;
  value: string;
  title: string;
  filename: string;
  firstLine?: string | null;
}): boolean {
  const semantic = parseSuggestionStorageKey(input.key) ?? input.key;
  const value = input.value.trim();
  if (!value) {
    return true;
  }
  if (semantic === 'amount' || semantic === 'total' || semantic === 'sum') {
    if (isZeroAmount(value)) {
      return true;
    }
  }
  if (semantic === 'vendor' || semantic === 'sender' || semantic === 'correspondent') {
    const normalizedValue = normalizeComparable(value);
    const title = normalizeComparable(input.title);
    const filenameStem = normalizeComparable(input.filename.replace(/\.[^.]+$/, ''));
    const firstLine = normalizeComparable(input.firstLine ?? '');
    if (title.length > 0 && normalizedValue === title) {
      return true;
    }
    if (filenameStem.length > 0 && normalizedValue === filenameStem) {
      return true;
    }
    if (firstLine.length > 0 && normalizedValue === firstLine) {
      return true;
    }
  }
  return false;
}
