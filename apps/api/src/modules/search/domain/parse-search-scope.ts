// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { GlobalSearchScopeType } from '@docuvate/contracts';

const PREFIX_MAP: Record<string, GlobalSearchScopeType> = {
  dokument: 'documents',
  document: 'documents',
  doc: 'documents',
  ordner: 'folders',
  folder: 'folders',
  label: 'labels',
  tag: 'labels',
  einstellung: 'settings',
  setting: 'settings',
  settings: 'settings',
  aktion: 'actions',
  action: 'actions',
};

const SEARCH_SCOPE_TYPES: readonly GlobalSearchScopeType[] = [
  'documents',
  'folders',
  'labels',
  'settings',
  'actions',
];

export interface SearchFieldFilter {
  fieldNameRaw: string;
  valueRaw: string;
}

export interface ParsedSearchScope {
  textQuery: string;
  scopes: GlobalSearchScopeType[];
  fieldFilters: SearchFieldFilter[];
}

function isGlobalSearchScopeType(value: string): value is GlobalSearchScopeType {
  for (const scope of SEARCH_SCOPE_TYPES) {
    if (scope === value) {
      return true;
    }
  }
  return false;
}

function scopeFromPrefixKey(key: string): GlobalSearchScopeType | null {
  if (Object.prototype.hasOwnProperty.call(PREFIX_MAP, key)) {
    return PREFIX_MAP[key];
  }
  return null;
}

export function parseSearchScope(raw: string): ParsedSearchScope {
  const scopes = new Set<GlobalSearchScopeType>();
  const textParts: string[] = [];
  const fieldFilters: SearchFieldFilter[] = [];
  for (const part of raw.trim().split(/\s+/)) {
    const match = /^([\p{L}][\p{L}0-9_-]*):(.*)$/u.exec(part);
    if (match) {
      const key = match[1].toLowerCase();
      const mapped = scopeFromPrefixKey(key);
      if (mapped) {
        scopes.add(mapped);
        const rest = match[2].trim();
        if (rest) textParts.push(rest);
        continue;
      }
      const valueRaw = match[2].trim();
      if (valueRaw) {
        fieldFilters.push({ fieldNameRaw: match[1], valueRaw });
      }
      continue;
    }
    textParts.push(part);
  }
  return {
    textQuery: textParts.join(' ').trim(),
    scopes: [...scopes],
    fieldFilters,
  };
}

export function resolveSearchTypes(
  requested: GlobalSearchScopeType[] | undefined,
  typesParam: string | undefined
): GlobalSearchScopeType[] {
  if (requested && requested.length > 0) {
    return requested;
  }
  if (typesParam?.trim()) {
    const parts = typesParam.split(',').map((p) => p.trim().toLowerCase());
    const mapped: GlobalSearchScopeType[] = [];
    for (const part of parts) {
      const fromPrefix = scopeFromPrefixKey(part);
      if (fromPrefix) {
        mapped.push(fromPrefix);
        continue;
      }
      if (isGlobalSearchScopeType(part)) {
        mapped.push(part);
      }
    }
    if (mapped.length > 0) return [...new Set(mapped)];
  }
  return ['documents', 'folders', 'labels', 'settings', 'actions'];
}
