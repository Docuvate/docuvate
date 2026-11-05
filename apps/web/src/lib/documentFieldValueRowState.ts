// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import type { FieldValueRowState } from '../components/ui/FieldValueRow';

/**
 * Only a person's confirm or correction marks a value as confirmed. Model confidence, however
 * high, keeps it a suggestion (UC12/13).
 */
export function isUserConfirmedField(field: Pick<ExtractedField, 'userConfirmed'>): boolean {
  return field.userConfirmed === true;
}

export function fieldValueRowState(
  field: ExtractedField,
  baseline: ExtractedField | undefined
): FieldValueRowState {
  if (baseline && field.value.trim() !== baseline.value.trim()) {
    return 'corrected';
  }
  if (isUserConfirmedField(field)) {
    return 'confirmed';
  }
  return 'suggested';
}

/** Returns `fields` with `key` set to a user-typed value, which counts as confirmed. */
export function withSavedFieldValue(
  fields: readonly ExtractedField[],
  key: string,
  value: string
): ExtractedField[] {
  if (!fields.some((field) => field.key === key)) {
    return [...fields, { key, value, confidence: 1, userConfirmed: true }];
  }
  return fields.map((field) =>
    field.key === key ? { ...field, value, confidence: 1, userConfirmed: true } : field
  );
}
