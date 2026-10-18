// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { semanticFieldKey, type ExtractedFieldRow } from './extracted-field-dedupe.js';

/** Plain keys produced by worker regex heuristics (not user catalog definitions). */
export const GLOBAL_HEURISTIC_FIELD_KEYS = new Set(['vendor', 'amount', 'date']);

const SUGGESTION_STORAGE_PREFIX = /^suggestion:([a-z0-9_]+)$/i;

export function suggestionStorageKey(semanticKey: string): string {
  return `suggestion:${semanticKey.trim().toLowerCase()}`;
}

export function parseSuggestionStorageKey(key: string): string | null {
  const match = SUGGESTION_STORAGE_PREFIX.exec(key.trim());
  return match ? match[1]! : null;
}

export type FieldSuggestionRow = {
  key: string;
  value: string;
  confidence?: number;
};

function normalizeCatalogKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_-]+/g, '');
}

export function catalogDefinesSemanticKey(
  catalogKeys: ReadonlySet<string>,
  semantic: string
): boolean {
  for (const key of catalogKeys) {
    if (semanticFieldKey({ key, value: '' }) === semantic) {
      return true;
    }
    if (normalizeCatalogKey(key) === semantic) {
      return true;
    }
  }
  return false;
}

export function isPlainGlobalHeuristicField(field: ExtractedFieldRow): boolean {
  const semantic = semanticFieldKey(field);
  return GLOBAL_HEURISTIC_FIELD_KEYS.has(semantic);
}

/**
 * Recognized rows for display/persistence vs heuristic suggestions when the field
 * is not in the user's recognized-field catalog.
 */
export function partitionRecognizedAndHeuristicSuggestions<T extends ExtractedFieldRow>(
  fields: T[],
  catalogKeys: ReadonlySet<string>,
  persistedSuggestions: FieldSuggestionRow[] = []
): { recognized: T[]; suggestions: FieldSuggestionRow[] } {
  const recognized: T[] = [];
  const suggestionMap = new Map<string, FieldSuggestionRow>();

  for (const row of persistedSuggestions) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key || !value) continue;
    suggestionMap.set(key, { key, value, confidence: row.confidence });
  }

  for (const field of fields) {
    const suggestionKey = parseSuggestionStorageKey(field.key);
    if (suggestionKey) {
      const value = field.value.trim();
      if (value) {
        suggestionMap.set(suggestionKey, {
          key: suggestionKey,
          value,
          confidence: field.confidence ?? 0.45,
        });
      }
      continue;
    }
    const semantic = semanticFieldKey(field);
    if (isPlainGlobalHeuristicField(field) && !catalogDefinesSemanticKey(catalogKeys, semantic)) {
      const key = semantic;
      const value = field.value.trim();
      if (value) {
        suggestionMap.set(key, {
          key,
          value,
          confidence: field.confidence ?? 0.45,
        });
      }
      continue;
    }
    recognized.push(field);
  }

  return { recognized, suggestions: [...suggestionMap.values()] };
}
