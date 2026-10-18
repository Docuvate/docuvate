// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import type { FieldValueRowState } from '../components/ui/FieldValueRow';

const CONFIRMED_THRESHOLD = 0.85;

export function fieldValueRowState(
  field: ExtractedField,
  baseline: ExtractedField | undefined
): FieldValueRowState {
  if (baseline && field.value.trim() !== baseline.value.trim()) {
    return 'corrected';
  }
  const confidence = field.confidence ?? 1;
  if (confidence >= CONFIRMED_THRESHOLD) {
    return 'confirmed';
  }
  return 'suggested';
}
