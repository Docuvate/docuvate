import type { CustomFieldType, RecognizedFieldLabelGateMatch } from '@docuvate/contracts';

export interface RecognizedFieldEntity {
  id: string;
  userId: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
  /** When true, extracted for every document after OCR (global default). */
  extractForAllDocuments: boolean;
  gateLabelIds: string[];
  gateLabelMatch: RecognizedFieldLabelGateMatch;
  minLabelConfidence: number | null;
  confidenceGateEnabled: boolean | null;
}

export function globalFieldStorageKey(fieldKey: string): string {
  return `global:${fieldKey}`;
}

export function parseGlobalFieldStorageKey(storageKey: string): string | null {
  const match = /^global:([a-z0-9_]+)$/i.exec(storageKey);
  return match ? match[1]! : null;
}
