// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import { fieldsByCorrectionSlot } from './correction-diff-slots.js';
import { extractionFieldValuesEquivalent } from './extraction-field-value-equivalence.js';

export interface ExtractionFieldCorrectionDraft {
  fieldKey: string;
  oldValue: string;
  newValue: string;
  fieldTagId: string | null;
}

function normalizeValue(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Emits one draft per semantic field slot whose normalized value changed. */
export function diffExtractionFieldCorrections(
  before: ExtractedField[],
  after: ExtractedField[]
): ExtractionFieldCorrectionDraft[] {
  const beforeBySlot = fieldsByCorrectionSlot(before);
  const afterBySlot = fieldsByCorrectionSlot(after);
  const slots = new Set([...beforeBySlot.keys(), ...afterBySlot.keys()]);
  const drafts: ExtractionFieldCorrectionDraft[] = [];

  for (const slot of slots) {
    const prev = beforeBySlot.get(slot);
    const next = afterBySlot.get(slot);
    const fieldKey = next?.key ?? prev?.key ?? slot;
    const oldValue = normalizeValue(prev?.value);
    const newValue = normalizeValue(next?.value);
    if (extractionFieldValuesEquivalent(fieldKey, oldValue, newValue)) {
      continue;
    }
    drafts.push({
      fieldKey,
      oldValue,
      newValue,
      fieldTagId: next?.tagId ?? prev?.tagId ?? null,
    });
  }

  return drafts;
}
