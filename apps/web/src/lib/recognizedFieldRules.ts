import type { RecognizedFieldDraft } from './recognizedFieldDraft';
import type { RecognizedFieldGateDraft } from '../components/settings/RecognizedFieldQualityGateEditor';
import { deriveKeyFromLabel } from './recognizedFieldKey';

export type FieldExtractionRuleMode = 'always' | 'labels';

export function getExtractionRuleMode(row: RecognizedFieldDraft): FieldExtractionRuleMode {
  if (row.extractForAllDocuments) {
    return 'always';
  }
  return 'labels';
}

export function applyExtractionRuleMode(
  row: RecognizedFieldDraft,
  mode: FieldExtractionRuleMode,
  defaults: RecognizedFieldGateDraft
): RecognizedFieldDraft {
  switch (mode) {
    case 'always':
      return { ...row, extractForAllDocuments: true, gateLabelIds: [] };
    case 'labels':
      return {
        ...row,
        extractForAllDocuments: false,
        gateLabelIds:
          row.gateLabelIds.length > 0 ? row.gateLabelIds : [...defaults.requiredLabelIds],
        confidenceGateEnabled: true,
        minLabelConfidence: row.minLabelConfidence ?? defaults.labelFieldConfidenceThreshold,
      };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function resolvedFieldKey(row: RecognizedFieldDraft): string {
  const trimmed = row.key.trim();
  if (trimmed) {
    return trimmed;
  }
  return deriveKeyFromLabel(row.label);
}

export function validateRecognizedFieldDrafts(
  fields: RecognizedFieldDraft[],
  messages: {
    missingLabel: (position: number) => string;
    missingKey: (label: string) => string;
    labelsRequired: (label: string) => string;
  }
): string[] {
  const errors: string[] = [];
  fields.forEach((row, index) => {
    const position = index + 1;
    if (!row.label.trim()) {
      errors.push(messages.missingLabel(position));
      return;
    }
    if (!resolvedFieldKey(row)) {
      errors.push(messages.missingKey(row.label.trim() || `#${position}`));
    }
    if (!row.extractForAllDocuments && row.gateLabelIds.length === 0) {
      errors.push(messages.labelsRequired(row.label.trim()));
    }
  });
  return errors;
}
