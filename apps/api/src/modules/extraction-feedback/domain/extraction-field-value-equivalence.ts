// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { semanticFieldKey } from '@docuvate/contracts';

import {
  normalizeFieldValue,
  type NormalizedFieldKind,
} from '../../search/domain/normalize-field-value.js';

function inferFieldKind(fieldKey: string): NormalizedFieldKind {
  const sem = semanticFieldKey({ key: fieldKey, value: '' });
  const normalizedKey = fieldKey.trim().toLowerCase();
  if (sem === 'date' || normalizedKey.includes('datum') || normalizedKey.includes('date')) {
    return 'date';
  }
  if (sem === 'amount' || sem === 'total') {
    return 'currency';
  }
  return 'text';
}

/** Whether two stored field values are the same for training feedback (type-aware normalization). */
export function extractionFieldValuesEquivalent(
  fieldKey: string,
  left: string,
  right: string
): boolean {
  const trimmedLeft = left.trim();
  const trimmedRight = right.trim();
  if (trimmedLeft === trimmedRight) {
    return true;
  }
  const kind = inferFieldKind(fieldKey);
  const normalizedLeft = normalizeFieldValue(trimmedLeft, kind);
  const normalizedRight = normalizeFieldValue(trimmedRight, kind);
  if (kind === 'date') {
    if (normalizedLeft.dateIso && normalizedRight.dateIso) {
      return normalizedLeft.dateIso === normalizedRight.dateIso;
    }
    return false;
  }
  if (kind === 'currency' || kind === 'number') {
    if (normalizedLeft.numeric != null && normalizedRight.numeric != null) {
      return normalizedLeft.numeric === normalizedRight.numeric;
    }
    return false;
  }
  const leftNorm = normalizedLeft.textNorm ?? '';
  const rightNorm = normalizedRight.textNorm ?? '';
  if (leftNorm.length > 0 && rightNorm.length > 0) {
    return leftNorm === rightNorm;
  }
  return false;
}
