// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FieldExtractionGateConfig } from './field-extraction-gate.js';
import type { FieldGateDefaults } from './field-gate-defaults.js';
import type { RecognizedFieldEntity } from './recognized-field.entity.js';

/** Builds the effective label gate for one catalog field (per-field overrides win over defaults). */
export function resolveFieldExtractionGateConfig(
  field: RecognizedFieldEntity,
  defaults: FieldGateDefaults
): FieldExtractionGateConfig {
  const confidenceGateEnabled = field.confidenceGateEnabled ?? defaults.confidenceGateEnabled;
  const minLabelConfidence = field.minLabelConfidence ?? defaults.minLabelConfidence;

  let requiredLabelIds = field.gateLabelIds;
  if (
    requiredLabelIds.length === 0 &&
    !field.extractForAllDocuments &&
    field.confidenceGateEnabled == null &&
    field.minLabelConfidence == null &&
    defaults.requiredLabelIds.length > 0
  ) {
    requiredLabelIds = defaults.requiredLabelIds;
  }

  return {
    confidenceGateEnabled,
    minLabelConfidence,
    requiredLabelIds,
    requiredLabelMatch: field.gateLabelMatch,
  };
}
