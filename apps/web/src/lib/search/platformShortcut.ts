export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform);
}

/** Compact header shortcut label (single chip). */
export function searchShortcutLabel(): string {
  return isMacPlatform() ? '⌘K' : 'Strg K';
}
