// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Same breakpoint as {@link useNarrowTopbar} (#93 compact header). */
export const NARROW_VIEWPORT_MAX_WIDTH_PX = 768;

export const NARROW_VIEWPORT_MEDIA_QUERY = `(max-width: ${NARROW_VIEWPORT_MAX_WIDTH_PX}px)`;

/** Synchronous narrow check (client only). */
export function readNarrowViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(NARROW_VIEWPORT_MEDIA_QUERY).matches;
}
