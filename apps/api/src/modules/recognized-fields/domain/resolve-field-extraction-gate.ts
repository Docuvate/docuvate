// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserPreferencesEntity } from '../../../shared/domain/ports.js';
import type { RecognizedFieldEntity } from './recognized-field.entity.js';
import type { FieldExtractionGateConfig } from './field-extraction-gate.js';

const DEFAULT_THRESHOLD = 0.62;

/** Builds the effective label gate for one catalog field (per-field overrides account defaults). */
export function resolveFieldExtractionGateConfig(
  field: RecognizedFieldEntity,
  prefs: UserPreferencesEntity
): FieldExtractionGateConfig {
  const confidenceGateEnabled =
    field.confidenceGateEnabled ?? prefs.fieldExtractionConfidenceGateEnabled;
  const minLabelConfidence =
    field.minLabelConfidence ?? prefs.labelFieldConfidenceThreshold ?? DEFAULT_THRESHOLD;

  let requiredLabelIds = field.gateLabelIds;
  if (
    requiredLabelIds.length === 0 &&
    !field.extractForAllDocuments &&
    field.confidenceGateEnabled == null &&
    field.minLabelConfidence == null &&
    prefs.fieldExtractionRequiredLabelIds.length > 0
  ) {
    requiredLabelIds = prefs.fieldExtractionRequiredLabelIds;
  }

  return {
    confidenceGateEnabled,
    minLabelConfidence,
    requiredLabelIds,
    requiredLabelMatch: field.gateLabelMatch ?? 'all',
  };
}
