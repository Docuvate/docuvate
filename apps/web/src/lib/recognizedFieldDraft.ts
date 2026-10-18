// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CustomFieldType,
  RecognizedFieldDefinitionDto,
  RecognizedFieldLabelGateMatch,
} from '@docuvate/contracts';

import type { RecognizedFieldGateDraft } from '../components/settings/RecognizedFieldQualityGateEditor';

export interface RecognizedFieldDraft {
  /** Stable React key; not sent to the API. */
  localId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  extractForAllDocuments: boolean;
  gateLabelIds: string[];
  gateLabelMatch: RecognizedFieldLabelGateMatch;
  minLabelConfidence: number;
  confidenceGateEnabled: boolean;
  showInFilter: boolean;
}

export function draftsFromRecognizedDefinitions(
  defs: RecognizedFieldDefinitionDto[],
  defaults?: Pick<
    RecognizedFieldGateDraft,
    'confidenceGateEnabled' | 'labelFieldConfidenceThreshold'
  >
): RecognizedFieldDraft[] {
  return defs.map((d) => ({
    localId: d.key,
    key: d.key,
    label: d.label,
    fieldType: d.fieldType,
    extractForAllDocuments: d.extractForAllDocuments,
    gateLabelIds: d.gateLabelIds,
    gateLabelMatch: d.gateLabelMatch,
    minLabelConfidence: d.minLabelConfidence ?? defaults?.labelFieldConfidenceThreshold ?? 0.62,
    confidenceGateEnabled: d.confidenceGateEnabled ?? defaults?.confidenceGateEnabled ?? true,
    showInFilter: d.showInFilter,
  }));
}

export function emptyRecognizedFieldDraft(
  defaults: RecognizedFieldGateDraft
): RecognizedFieldDraft {
  return {
    localId: crypto.randomUUID(),
    key: '',
    label: '',
    fieldType: 'text',
    extractForAllDocuments: false,
    gateLabelIds: [...defaults.requiredLabelIds],
    gateLabelMatch: 'all',
    minLabelConfidence: defaults.labelFieldConfidenceThreshold,
    confidenceGateEnabled: defaults.confidenceGateEnabled,
    showInFilter: false,
  };
}

export const RECOGNIZED_FIELD_STARTER_PRESETS: RecognizedFieldDraft[] = [
  {
    localId: 'datum',
    key: 'datum',
    label: 'Datum',
    fieldType: 'date',
    extractForAllDocuments: true,
    gateLabelIds: [],
    gateLabelMatch: 'all',
    minLabelConfidence: 0.62,
    confidenceGateEnabled: true,
    showInFilter: false,
  },
  {
    localId: 'absender',
    key: 'absender',
    label: 'Absender',
    fieldType: 'text',
    extractForAllDocuments: true,
    gateLabelIds: [],
    gateLabelMatch: 'all',
    minLabelConfidence: 0.62,
    confidenceGateEnabled: true,
    showInFilter: true,
  },
];
