export type LibraryViewMode = 'klassisch' | 'karten' | 'fokus';

const STORAGE_KEY = 'docuvate.library.viewMode';

export function readLibraryViewMode(): LibraryViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'klassisch' || raw === 'karten' || raw === 'fokus') {
      return raw;
    }
  } catch {
    /* private mode */
  }
  return 'klassisch';
}

export function writeLibraryViewMode(mode: LibraryViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
