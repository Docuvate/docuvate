// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RecognizedFieldEntity } from './recognized-field.entity.js';

export function recognizedFieldConfigSignature(field: RecognizedFieldEntity): string {
  const gateIds = [...field.gateLabelIds].sort().join(',');
  return [
    field.label,
    field.fieldType,
    field.extractForAllDocuments ? '1' : '0',
    gateIds,
    field.gateLabelMatch,
    field.minLabelConfidence ?? '',
    field.confidenceGateEnabled ?? '',
  ].join('|');
}

export function recognizedFieldKeysNeedingReextraction(
  previous: readonly RecognizedFieldEntity[],
  next: readonly RecognizedFieldEntity[]
): string[] {
  const prevByKey = new Map(previous.map((field) => [field.key, field]));
  const keys: string[] = [];
  for (const field of next) {
    const prior = prevByKey.get(field.key);
    if (!prior || recognizedFieldConfigSignature(prior) !== recognizedFieldConfigSignature(field)) {
      keys.push(field.key);
    }
  }
  return keys;
}
