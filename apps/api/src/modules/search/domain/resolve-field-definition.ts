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
