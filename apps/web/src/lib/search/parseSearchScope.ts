// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type ClientSearchScope = 'documents' | 'folders' | 'labels' | 'settings' | 'actions';

const PREFIX: Record<string, ClientSearchScope> = {
  dokument: 'documents',
  document: 'documents',
  ordner: 'folders',
  folder: 'folders',
  label: 'labels',
  einstellung: 'settings',
  setting: 'settings',
  aktion: 'actions',
  action: 'actions',
};

export function parseClientSearchScope(raw: string): {
  text: string;
  scopes: ClientSearchScope[];
  /** Raw query sent to API (preserves field:value tokens). */
  apiQuery: string;
} {
  const scopes = new Set<ClientSearchScope>();
  const parts: string[] = [];
  const apiParts: string[] = [];
  for (const token of raw.trim().split(/\s+/)) {
    const m = /^([\p{L}][\p{L}0-9_-]*):(.*)$/u.exec(token);
    if (m) {
      const scope = PREFIX[m[1].toLowerCase()];
      if (scope) {
        scopes.add(scope);
        const rest = m[2]?.trim();
        if (rest) parts.push(rest);
        continue;
      }
      apiParts.push(token);
      continue;
    }
    parts.push(token);
    apiParts.push(token);
  }
  return {
    text: parts.join(' ').trim(),
    scopes: [...scopes],
    apiQuery: apiParts.join(' ').trim(),
  };
}
