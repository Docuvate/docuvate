// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect, useState } from 'react';

/** Ordner/filesystem doc list: stack rows when viewport is narrow (tree + table). */
export const FILESYSTEM_COMPACT_DOCS_MAX_WIDTH_PX = 1280;

export const FILESYSTEM_COMPACT_DOCS_MEDIA_QUERY = `(max-width: ${FILESYSTEM_COMPACT_DOCS_MAX_WIDTH_PX}px)`;

export function readFilesystemCompactDocs(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(FILESYSTEM_COMPACT_DOCS_MEDIA_QUERY).matches;
}

export function useFilesystemCompactDocs(enabled: boolean): boolean {
  const [matches, setMatches] = useState(() => (enabled ? readFilesystemCompactDocs() : false));

  useLayoutEffect(() => {
    if (!enabled) {
      setMatches(false);
      return;
    }
    const mq = window.matchMedia(FILESYSTEM_COMPACT_DOCS_MEDIA_QUERY);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [enabled]);

  return enabled && matches;
}
