// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type ExtractedField,
  type RecognizedFieldDefinitionDto,
  semanticFieldKey,
} from '@docuvate/contracts';

export interface RecognizedFieldDefinitionIndex {
  definitionIdByCatalogKey: ReadonlyMap<string, string>;
  definitionIdBySemantic: ReadonlyMap<string, string>;
}

export function buildRecognizedFieldDefinitionIndex(
  catalog: readonly RecognizedFieldDefinitionDto[]
): RecognizedFieldDefinitionIndex {
  const definitionIdByCatalogKey = new Map<string, string>();
  const definitionIdBySemantic = new Map<string, string>();
  for (const def of catalog) {
    definitionIdByCatalogKey.set(def.key, def.id);
    const semantic = semanticFieldKey({ key: def.key, value: '' });
    definitionIdBySemantic.set(semantic, def.id);
  }
  return { definitionIdByCatalogKey, definitionIdBySemantic };
}

export function definitionIdForFieldKey(
  key: string,
  index: RecognizedFieldDefinitionIndex
): string | null {
  const direct = index.definitionIdByCatalogKey.get(key);
  if (direct) {
    return direct;
  }
  const semantic = semanticFieldKey({ key, value: '' });
  return index.definitionIdBySemantic.get(semantic) ?? null;
}

export function definitionIdForExtractedField(
  field: ExtractedField,
  index: RecognizedFieldDefinitionIndex
): string | null {
  return definitionIdForFieldKey(field.key, index);
}

export function persistedRecognizedDefinitionIds(
  fields: readonly ExtractedField[],
  index: RecognizedFieldDefinitionIndex
): Set<string> {
  const ids = new Set<string>();
  for (const field of fields) {
    const id = definitionIdForExtractedField(field, index);
    if (id) {
      ids.add(id);
    }
  }
  return ids;
}

export function suggestionMatchesPersistedDefinition(
  suggestionKey: string,
  persistedDefinitionIds: ReadonlySet<string>,
  index: RecognizedFieldDefinitionIndex
): boolean {
  const id = definitionIdForFieldKey(suggestionKey, index);
  return id != null && persistedDefinitionIds.has(id);
}
