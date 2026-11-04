// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { replaceRecognizedFields } from './api';
import type { RecognizedFieldDraft, RecognizedFieldGateDraft } from './recognizedFieldDraft';
import { draftsFromRecognizedDefinitions } from './recognizedFieldDraft';
import { resolvedFieldKey } from './recognizedFieldRules';

function recognizedFieldsToApiPayload(fields: RecognizedFieldDraft[]) {
  return fields.map((row, index) => ({
    key: resolvedFieldKey(row),
    label: row.label.trim(),
    fieldType: row.fieldType,
    sortOrder: index,
    extractForAllDocuments: row.extractForAllDocuments,
    gateLabelIds: row.extractForAllDocuments ? [] : row.gateLabelIds,
    gateLabelMatch: row.gateLabelMatch,
    minLabelConfidence: row.extractForAllDocuments ? null : row.minLabelConfidence,
    confidenceGateEnabled: row.extractForAllDocuments ? null : row.confidenceGateEnabled,
    showInFilter: row.showInFilter,
  }));
}

export async function persistRecognizedFieldCatalog(
  fields: RecognizedFieldDraft[],
  gateDefaults: RecognizedFieldGateDraft
): Promise<RecognizedFieldDraft[]> {
  const items = await replaceRecognizedFields({ fields: recognizedFieldsToApiPayload(fields) });
  return draftsFromRecognizedDefinitions(items, gateDefaults);
}
