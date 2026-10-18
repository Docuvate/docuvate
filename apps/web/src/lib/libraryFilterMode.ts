// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type LibraryFilterMode = 'ui' | 'query';

const STORAGE_KEY = 'docuvate.library.filterMode';

export function readLibraryFilterMode(): LibraryFilterMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'query' ? 'query' : 'ui';
  } catch {
    return 'ui';
  }
}

export function writeLibraryFilterMode(mode: LibraryFilterMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
