// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { RecognizedFieldEntity } from './recognized-field.entity.js';
import {
  recognizedFieldConfigSignature,
  recognizedFieldKeysNeedingReextraction,
} from './recognized-field-config-signature.js';

function sampleField(overrides: Partial<RecognizedFieldEntity> = {}): RecognizedFieldEntity {
  return {
    id: 'id-1',
    userId: 'user-1',
    key: 'bruttoentgelt',
    label: 'Bruttoentgelt',
    fieldType: 'currency',
    sortOrder: 0,
    extractForAllDocuments: false,
    gateLabelIds: ['tag-a'],
    gateLabelMatch: 'any',
    minLabelConfidence: 0.62,
    confidenceGateEnabled: true,
    ...overrides,
  };
}

describe('recognizedFieldConfigSignature', () => {
  it('detects label and gate changes for re-extraction', () => {
    const previous = [sampleField()];
    const next = [sampleField({ id: 'id-2', label: 'Nettoentgelt' })];
    expect(recognizedFieldKeysNeedingReextraction(previous, next)).toEqual(['bruttoentgelt']);
    expect(recognizedFieldConfigSignature(previous[0])).not.toBe(
      recognizedFieldConfigSignature(next[0])
    );
  });
});
