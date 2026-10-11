// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/i.test(navigator.userAgent);
}

/** Compact header shortcut label (single chip). */
export function searchShortcutLabel(): string {
  return isMacPlatform() ? '⌘K' : 'Strg K';
}
