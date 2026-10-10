// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RecognizedFieldDefinitionDto } from '@docuvate/contracts';

import type { RecognizedFieldEntity } from '../domain/recognized-field.entity.js';

export function toRecognizedFieldDto(entity: RecognizedFieldEntity): RecognizedFieldDefinitionDto {
  return {
    id: entity.id,
    key: entity.key,
    label: entity.label,
    fieldType: entity.fieldType,
    sortOrder: entity.sortOrder,
    extractForAllDocuments: entity.extractForAllDocuments,
    gateLabelIds: entity.gateLabelIds,
    gateLabelMatch: entity.gateLabelMatch,
    minLabelConfidence: entity.minLabelConfidence,
    confidenceGateEnabled: entity.confidenceGateEnabled,
  };
}
