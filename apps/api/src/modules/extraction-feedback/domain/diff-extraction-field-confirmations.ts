// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import { fieldsByCorrectionSlot } from './correction-diff-slots.js';
import { extractionFieldValuesEquivalent } from './extraction-field-value-equivalence.js';

interface ExtractionFieldConfirmationDraft {
  fieldKey: string;
  value: string;
  fieldTagId: string | null;
}

/**
 * Emits one draft per field a person newly confirmed (`userConfirmed`) without a normalized value
 * change. Model confidence never counts as a confirmation.
 */
export function diffExtractionFieldConfirmations(
  before: ExtractedField[],
  after: ExtractedField[]
): ExtractionFieldConfirmationDraft[] {
  const beforeBySlot = fieldsByCorrectionSlot(before);
  const afterBySlot = fieldsByCorrectionSlot(after);
  const slots = new Set([...beforeBySlot.keys(), ...afterBySlot.keys()]);
  const drafts: ExtractionFieldConfirmationDraft[] = [];

  for (const slot of slots) {
    const prev = beforeBySlot.get(slot);
    const next = afterBySlot.get(slot);
    if (!next) {
      continue;
    }
    const fieldKey = next.key;
    const oldValue = (prev?.value ?? next.value).trim();
    const newValue = next.value.trim();
    if (!extractionFieldValuesEquivalent(fieldKey, oldValue, newValue)) {
      continue;
    }
    const wasConfirmed = prev?.userConfirmed === true;
    if (next.userConfirmed !== true || wasConfirmed) {
      continue;
    }
    drafts.push({
      fieldKey,
      value: newValue,
      fieldTagId: next.tagId ?? prev?.tagId ?? null,
    });
  }

  return drafts;
}
