export type PrimaryNavKey = 'docs' | 'comparisons' | 'api' | 'sdks';

/** Documentation path without locale prefix (e.g. `/docs/api`). */
export function resolvePrimaryNavKey(path: string): PrimaryNavKey | null {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/docs/api' || normalized.startsWith('/docs/api/')) return 'api';
  if (normalized === '/docs/sdks' || normalized.startsWith('/docs/sdks/')) return 'sdks';
  if (normalized.startsWith('/docs/vergleiche') || normalized.startsWith('/docs/comparisons')) {
    return 'comparisons';
  }
  if (normalized === '/docs' || normalized.startsWith('/docs/')) return 'docs';
  return null;
}
