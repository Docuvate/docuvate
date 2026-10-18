// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useSyncExternalStore } from 'react';

export const ADVANCED_FEATURES_STORAGE_KEY = 'docuvate.advancedFeatures';

export function readAdvancedFeaturesEnabled(): boolean {
  if (import.meta.env.VITE_ADVANCED_FEATURES === 'true') {
    return true;
  }
  try {
    return localStorage.getItem(ADVANCED_FEATURES_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Sync local cache from server-backed user preference (also used after login). */
export function writeAdvancedFeaturesEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ADVANCED_FEATURES_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('docuvate-advanced-features'));
}

function subscribeAdvancedFeatures(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('docuvate-advanced-features', onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('docuvate-advanced-features', onStoreChange);
  };
}

export function useAdvancedFeaturesEnabled(): {
  advancedFeaturesEnabled: boolean;
  setAdvancedFeaturesEnabled: (enabled: boolean) => void;
} {
  const advancedFeaturesEnabled = useSyncExternalStore(
    subscribeAdvancedFeatures,
    readAdvancedFeaturesEnabled,
    () => false
  );

  const setAdvancedFeaturesEnabled = useCallback((next: boolean) => {
    writeAdvancedFeaturesEnabled(next);
  }, []);

  return { advancedFeaturesEnabled, setAdvancedFeaturesEnabled };
}
