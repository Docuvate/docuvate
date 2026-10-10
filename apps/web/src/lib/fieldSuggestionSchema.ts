// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  GLOBAL_HEURISTIC_FIELD_KEYS,
  catalogDefinesSemanticKey,
  semanticFieldKey,
} from '@docuvate/contracts';

export function fieldSuggestionOutsideUserSchema(
  key: string,
  catalogKeys: ReadonlySet<string>
): boolean {
  const semantic = semanticFieldKey({ key, value: '' });
  if (GLOBAL_HEURISTIC_FIELD_KEYS.has(semantic)) {
    return false;
  }
  if (catalogDefinesSemanticKey(catalogKeys, semantic)) {
    return false;
  }
  return true;
}
