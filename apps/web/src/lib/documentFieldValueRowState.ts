// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import type { FieldValueRowState } from '../components/ui/FieldValueRow';

const CONFIRMED_THRESHOLD = 0.85;

/** A value without confidence was never scored or confirmed, so it stays a suggestion. */
export function isConfirmedFieldConfidence(confidence: number | undefined): boolean {
  return confidence != null && confidence >= CONFIRMED_THRESHOLD;
}

export function fieldValueRowState(
  field: ExtractedField,
  baseline: ExtractedField | undefined
): FieldValueRowState {
  if (baseline && field.value.trim() !== baseline.value.trim()) {
    return 'corrected';
  }
  if (isConfirmedFieldConfidence(field.confidence)) {
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
    return [...fields, { key, value, confidence: 1 }];
  }
  return fields.map((field) => (field.key === key ? { ...field, value, confidence: 1 } : field));
}
