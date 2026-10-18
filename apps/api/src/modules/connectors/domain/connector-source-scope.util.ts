// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorSourceScopeDto } from '@docuvate/contracts';

function normalizePathPrefix(path: string): string {
  const trimmed = path.trim();
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/** Whether an importable ref (file path or object key) falls within the configured scope. */
export function importRefMatchesSourceScope(scope: ConnectorSourceScopeDto, ref: string): boolean {
  if (scope.mode === 'all') {
    return true;
  }
  const normalizedRef = ref.trim();
  for (const selected of scope.paths) {
    const prefix = normalizePathPrefix(selected);
    if (prefix.length === 0) {
      continue;
    }
    if (normalizedRef === selected.trim() || normalizedRef.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}
