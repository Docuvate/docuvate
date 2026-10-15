// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseSuggestionStorageKey } from '@docuvate/contracts';

function normalizeComparable(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}


function looksLikePersonalOrAddressFragment(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 6) {
    return false;
  }
  const parts = trimmed.split(/\s+/);
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(trimmed)) {
    return true;
  }
  if (/\b\d{5}\b/.test(trimmed) && parts.length >= 3) {
    return true;
  }
  const digits = trimmed.replace(/\D/g, '').length;
  if (digits >= 6 && parts.length >= 4 && trimmed.length <= 120) {
    return true;
  }
  return false;
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
    if (looksLikePersonalOrAddressFragment(value)) {
      return true;
    }
  }
  return false;
}
