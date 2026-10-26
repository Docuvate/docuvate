// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import { fieldsByCorrectionSlot } from './correction-diff-slots.js';
import { extractionFieldValuesEquivalent } from './extraction-field-value-equivalence.js';

export const FIELD_CONFIRMED_CONFIDENCE_THRESHOLD = 0.85;

export interface ExtractionFieldConfirmationDraft {
  fieldKey: string;
  fieldTagId: string | null;
}

function isConfirmedConfidence(confidence: number | undefined): boolean {
  return (confidence ?? 1) >= FIELD_CONFIRMED_CONFIDENCE_THRESHOLD;
}

/** Emits one draft per field newly confirmed without a normalized value change. */
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
    const wasConfirmed = isConfirmedConfidence(prev?.confidence);
    const isConfirmed = isConfirmedConfidence(next.confidence);
    if (!isConfirmed || wasConfirmed) {
      continue;
    }
    drafts.push({
      fieldKey,
      fieldTagId: next.tagId ?? prev?.tagId ?? null,
    });
  }

  return drafts;
}
