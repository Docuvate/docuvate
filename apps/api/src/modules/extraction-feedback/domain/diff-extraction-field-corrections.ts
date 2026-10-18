// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

export interface ExtractionFieldCorrectionDraft {
  fieldKey: string;
  oldValue: string;
  newValue: string;
  fieldTagId: string | null;
}

function normalizeValue(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Emits one draft per field key whose trimmed value changed. */
export function diffExtractionFieldCorrections(
  before: ExtractedField[],
  after: ExtractedField[]
): ExtractionFieldCorrectionDraft[] {
  const beforeByKey = new Map(before.map((row) => [row.key, row]));
  const afterByKey = new Map(after.map((row) => [row.key, row]));
  const keys = new Set([...beforeByKey.keys(), ...afterByKey.keys()]);
  const drafts: ExtractionFieldCorrectionDraft[] = [];

  for (const key of keys) {
    const prev = beforeByKey.get(key);
    const next = afterByKey.get(key);
    const oldValue = normalizeValue(prev?.value);
    const newValue = normalizeValue(next?.value);
    if (oldValue === newValue) {
      continue;
    }
    drafts.push({
      fieldKey: key,
      oldValue,
      newValue,
      fieldTagId: next?.tagId ?? prev?.tagId ?? null,
    });
  }

  return drafts;
}
