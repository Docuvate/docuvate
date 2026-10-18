// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentReviewFieldSuggestionDto, ExtractedField } from '@docuvate/contracts';
import {
  parseSuggestionStorageKey,
  partitionRecognizedAndHeuristicSuggestions,
  semanticFieldKey,
} from '@docuvate/contracts';

import {
  defaultFieldLabel,
  type FieldDefinitionLookup,
} from '../../../search/infrastructure/document-field-value-index.js';
import { isJunkReviewFieldSuggestion } from './review-field-junk-filter.js';

export function fieldDisplayLabel(
  fieldKey: string,
  definitions: Map<string, FieldDefinitionLookup>
): string {
  const suggestionSemantic = parseSuggestionStorageKey(fieldKey);
  const semantic = suggestionSemantic ?? semanticFieldKey({ key: fieldKey, value: '' });
  const globalStorage = `global:${semantic}`;
  const fromCatalog = definitions.get(globalStorage)?.label;
  if (fromCatalog) {
    return fromCatalog;
  }
  if (suggestionSemantic) {
    return defaultFieldLabel(`global:${suggestionSemantic}`);
  }
  return defaultFieldLabel(fieldKey);
}

export function buildReviewFieldSuggestions(
  fields: ExtractedField[],
  catalogKeys: ReadonlySet<string>,
  definitions: Map<string, FieldDefinitionLookup>,
  context: {
    minConfidence?: number;
    title: string;
    filename: string;
    firstLine?: string | null;
  }
): DocumentReviewFieldSuggestionDto[] {
  const minConfidence = context.minConfidence ?? 0;
  const { suggestions } = partitionRecognizedAndHeuristicSuggestions(fields, catalogKeys);
  return suggestions
    .filter((s) => s.value.trim().length > 0 && (s.confidence ?? 0) >= minConfidence)
    .filter(
      (s) =>
        !isJunkReviewFieldSuggestion({
          key: s.key,
          value: s.value,
          title: context.title,
          filename: context.filename,
          firstLine: context.firstLine,
        })
    )
    .map((s) => ({
      key: s.key,
      displayLabel: fieldDisplayLabel(s.key, definitions),
      value: s.value,
      confidence: s.confidence,
    }));
}

export function isoDateFromFieldValue(raw: string): string | null {
  const value = raw.trim();
  const deFull = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (deFull) {
    const dayPart = deFull[1];
    const monthPart = deFull[2];
    const yearPart = deFull[3];
    if (!dayPart || !monthPart || !yearPart) {
      return null;
    }
    return `${yearPart}-${monthPart.padStart(2, '0')}-${dayPart.padStart(2, '0')}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    return value;
  }
  const monthYear = /^(\d{1,2})[./](\d{4})$/.exec(value);
  if (monthYear) {
    const monthPart = monthYear[1];
    const yearPart = monthYear[2];
    if (!monthPart || !yearPart) {
      return null;
    }
    const month = Number.parseInt(monthPart, 10);
    if (month < 1 || month > 12) {
      return null;
    }
    return `${yearPart}-${monthPart.padStart(2, '0')}-01`;
  }
  return null;
}
