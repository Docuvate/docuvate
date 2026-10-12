// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type DocumentDto,
  type ExtractedField,
  evaluateFieldExtractionGate,
  type FieldExtractionGateConfig,
  type RecognizedFieldDefinitionDto,
  semanticFieldKey,
  type TagDto,
  type UserSettingsDto,
} from '@docuvate/contracts';

import { definitionIdForFieldKey } from './recognizedFieldDefinitionIndex';

export interface CatalogFieldGateContext {
  assignedTagIds: string[];
  assignedNonInboxTagIds: string[];
  suggestions: { tagId: string; confidence: number; isInbox: boolean }[];
}

export function catalogFieldGateContextFromDocument(
  doc: DocumentDto,
  tags: readonly TagDto[]
): CatalogFieldGateContext {
  const inboxIds = new Set(tags.filter((t) => t.isInbox).map((t) => t.id));
  const assignedTagIds = doc.tags.map((t) => t.id);
  const assignedNonInboxTagIds = doc.tags.filter((t) => !t.isInbox).map((t) => t.id);
  const suggestions =
    doc.tagSuggestions?.map((s) => ({
      tagId: s.tag.id,
      confidence: s.confidence ?? 0,
      isInbox: inboxIds.has(s.tag.id),
    })) ?? [];
  return { assignedTagIds, assignedNonInboxTagIds, suggestions };
}

function gateConfigForDefinition(
  def: RecognizedFieldDefinitionDto,
  settings: Pick<
    UserSettingsDto,
    | 'fieldExtractionConfidenceGateEnabled'
    | 'labelFieldConfidenceThreshold'
    | 'fieldExtractionRequiredLabelIds'
  >
): FieldExtractionGateConfig {
  const confidenceGateEnabled =
    def.confidenceGateEnabled ?? settings.fieldExtractionConfidenceGateEnabled !== false;
  const minLabelConfidence = def.minLabelConfidence ?? settings.labelFieldConfidenceThreshold ?? 0.62;

  let requiredLabelIds = def.gateLabelIds;
  if (
    requiredLabelIds.length === 0 &&
    !def.extractForAllDocuments &&
    def.confidenceGateEnabled == null &&
    def.minLabelConfidence == null &&
    (settings.fieldExtractionRequiredLabelIds?.length ?? 0) > 0
  ) {
    requiredLabelIds = settings.fieldExtractionRequiredLabelIds ?? [];
  }

  return {
    confidenceGateEnabled,
    minLabelConfidence,
    requiredLabelIds,
    requiredLabelMatch: def.gateLabelMatch,
  };
}

/** Catalog rows that should appear in Erkannte Felder (including empty gated slots). */
export function mergeCatalogFieldsForDocument(
  persisted: readonly ExtractedField[],
  catalog: readonly RecognizedFieldDefinitionDto[],
  gateContext: CatalogFieldGateContext,
  settings: Pick<
    UserSettingsDto,
    | 'fieldExtractionConfidenceGateEnabled'
    | 'labelFieldConfidenceThreshold'
    | 'fieldExtractionRequiredLabelIds'
  >
): ExtractedField[] {
  const byDefinitionId = new Map<string, ExtractedField>();
  for (const field of persisted) {
    for (const def of catalog) {
      if (def.key === field.key || semanticFieldKey({ key: def.key, value: '' }) === semanticFieldKey(field)) {
        byDefinitionId.set(def.id, field);
        break;
      }
    }
  }

  const merged: ExtractedField[] = [...persisted];
  const seenKeys = new Set(persisted.map((f) => f.key));

  for (const def of catalog) {
    if (byDefinitionId.has(def.id)) {
      continue;
    }
    const gated = !def.extractForAllDocuments;
    if (gated) {
      const open = evaluateFieldExtractionGate(gateContext, gateConfigForDefinition(def, settings));
      if (!open) {
        continue;
      }
    }
    if (seenKeys.has(def.key)) {
      continue;
    }
    merged.push({ key: def.key, value: '', confidence: undefined });
    seenKeys.add(def.key);
  }

  return merged;
}

export function catalogDefinitionIdForKey(
  key: string,
  catalog: readonly RecognizedFieldDefinitionDto[]
): string | null {
  return definitionIdForFieldKey(
    key,
    {
      definitionIdByCatalogKey: new Map(catalog.map((d) => [d.key, d.id])),
      definitionIdBySemantic: new Map(
        catalog.map((d) => [semanticFieldKey({ key: d.key, value: '' }), d.id])
      ),
    }
  );
}
