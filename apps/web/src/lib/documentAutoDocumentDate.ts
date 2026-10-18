// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type ExtractedField,
  isPlausibleExtractedDateValue,
  semanticFieldKey,
} from '@docuvate/contracts';

const AUTO_DATE_CONFIDENCE_MIN = 0.72;

export function isoDateFromExtractedValue(raw: string): string | null {
  const value = raw.trim();
  if (!isPlausibleExtractedDateValue(value)) {
    return null;
  }
  const deFull = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (deFull) {
    const dayPart = deFull[1];
    const monthPart = deFull[2];
    const yearPart = deFull[3];
    if (!dayPart || !monthPart || !yearPart) {
      return null;
    }
    const day = dayPart.padStart(2, '0');
    const month = monthPart.padStart(2, '0');
    return `${yearPart}-${month}-${day}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    return value;
  }
  return null;
}

export function pickAutoDocumentDateFromFields(
  fields: readonly ExtractedField[]
): { isoDate: string; sourceKey: string } | null {
  let best: { isoDate: string; sourceKey: string; confidence: number } | null = null;
  for (const field of fields) {
    if (semanticFieldKey(field) !== 'date') {
      continue;
    }
    const confidence = field.confidence ?? 0;
    if (confidence < AUTO_DATE_CONFIDENCE_MIN) {
      continue;
    }
    const isoDate = isoDateFromExtractedValue(field.value);
    if (!isoDate) {
      continue;
    }
    if (!best || confidence > best.confidence) {
      best = { isoDate, sourceKey: field.key, confidence };
    }
  }
  return best ? { isoDate: best.isoDate, sourceKey: best.sourceKey } : null;
}
