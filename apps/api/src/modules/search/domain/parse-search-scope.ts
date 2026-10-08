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

export interface SearchFieldFilter {
  fieldNameRaw: string;
  valueRaw: string;
}

export interface ParsedSearchScope {
  textQuery: string;
  scopes: GlobalSearchScopeType[];
  fieldFilters: SearchFieldFilter[];
}

export function parseSearchScope(raw: string): ParsedSearchScope {
  const scopes = new Set<GlobalSearchScopeType>();
  const textParts: string[] = [];
  const fieldFilters: SearchFieldFilter[] = [];
  for (const part of raw.trim().split(/\s+/)) {
    const match = /^([\p{L}][\p{L}0-9_-]*):(.*)$/u.exec(part);
    if (match) {
      const key = match[1]!.toLowerCase();
      const mapped = PREFIX_MAP[key];
      if (mapped) {
        scopes.add(mapped);
        const rest = match[2]?.trim();
        if (rest) textParts.push(rest);
        continue;
      }
      const valueRaw = match[2]?.trim() ?? '';
      if (valueRaw) {
        fieldFilters.push({ fieldNameRaw: match[1]!, valueRaw });
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
    const mapped = parts
      .map((p) => PREFIX_MAP[p] ?? (p as GlobalSearchScopeType))
      .filter((t): t is GlobalSearchScopeType =>
        ['documents', 'folders', 'labels', 'settings', 'actions'].includes(t)
      );
    if (mapped.length > 0) return [...new Set(mapped)];
  }
  return ['documents', 'folders', 'labels', 'settings', 'actions'];
}
