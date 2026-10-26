// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  dedupeExtractedFields,
  type ExtractedField,
  semanticFieldKey,
} from '@docuvate/contracts';

function correctionSlotKey(field: ExtractedField): string {
  if (field.tagId) {
    return `label:${field.tagId}:${semanticFieldKey(field)}`;
  }
  return `shared:${semanticFieldKey(field)}`;
}

/** One field row per semantic slot so alias keys (e.g. `global:datum` vs `date`) do not double-count. */
export function fieldsByCorrectionSlot(fields: ExtractedField[]): Map<string, ExtractedField> {
  const deduped = dedupeExtractedFields(fields);
  const map = new Map<string, ExtractedField>();
  for (const field of deduped) {
    map.set(correctionSlotKey(field), field);
  }
  return map;
}
