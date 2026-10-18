// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';

import { normalizeSearchText } from './normalize-search-text.js';

export interface SearchFieldDefinitionRow {
  storageKey: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
}

export interface ResolvedFieldFilter {
  storageKeys: string[];
  valueRaw: string;
  fieldLabel: string;
}

function foldKey(input: string): string {
  return normalizeSearchText(input).replace(/[^a-z0-9]+/g, '');
}

/** Resolve palette field filter tokens (fuzzy field name → storage keys). */
export function resolveFieldFilters(
  filters: { fieldNameRaw: string; valueRaw: string }[],
  defs: SearchFieldDefinitionRow[]
): ResolvedFieldFilter[] {
  const resolved: ResolvedFieldFilter[] = [];
  for (const filter of filters) {
    const probe = foldKey(filter.fieldNameRaw);
    if (!probe) continue;
    const matches = defs.filter((def) => {
      const keyFold = foldKey(def.key);
      const labelFold = foldKey(def.label);
      return (
        keyFold === probe ||
        labelFold === probe ||
        keyFold.includes(probe) ||
        labelFold.includes(probe) ||
        probe.includes(keyFold)
      );
    });
    if (matches.length === 0) {
      continue;
    }
    resolved.push({
      storageKeys: matches.map((m) => m.storageKey),
      valueRaw: filter.valueRaw,
      fieldLabel: matches[0].label,
    });
  }
  return resolved;
}

/** Suggest field keys/labels while typing `abs…:` in the palette. */
export function suggestFieldNames(
  partial: string,
  defs: SearchFieldDefinitionRow[],
  limit = 8
): string[] {
  const probe = foldKey(partial);
  if (!probe) return [];
  const scored = defs
    .map((def) => {
      const keyFold = foldKey(def.key);
      const labelFold = foldKey(def.label);
      let score = 0;
      if (keyFold.startsWith(probe) || labelFold.startsWith(probe)) score += 3;
      if (keyFold.includes(probe) || labelFold.includes(probe)) score += 1;
      return { key: def.key, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((r) => r.key);
}
