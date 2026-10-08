import { useEffect } from 'react';

export function useSaveKeyboardShortcut(enabled: boolean, onSave: () => void) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onSave]);
}
