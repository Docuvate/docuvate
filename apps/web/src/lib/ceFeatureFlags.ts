// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CeFeatureFlagsDto } from '@docuvate/contracts';
import { isCeSourceConnectorPluginId } from '@docuvate/contracts';
import { useSyncExternalStore } from 'react';

import { getCeFeatureFlags } from './api';

const CE_FLAGS_DEFAULT: CeFeatureFlagsDto = {
  layoutReconstructionCompare: false,
  sourceConnectors: false,
  experimentalResearchModels: false,
};

let cachedFlags: CeFeatureFlagsDto = CE_FLAGS_DEFAULT;
let loadPromise: Promise<CeFeatureFlagsDto> | null = null;

function emitCeFlagsChange(): void {
  window.dispatchEvent(new Event('docuvate-ce-flags'));
}

export function readCeFeatureFlags(): CeFeatureFlagsDto {
  return cachedFlags;
}

export async function ensureCeFeatureFlagsLoaded(): Promise<CeFeatureFlagsDto> {
  if (!loadPromise) {
    loadPromise = getCeFeatureFlags()
      .then((flags) => {
        cachedFlags = flags;
        emitCeFlagsChange();
        return flags;
      })
      .catch(() => {
        cachedFlags = CE_FLAGS_DEFAULT;
        emitCeFlagsChange();
        return CE_FLAGS_DEFAULT;
      });
  }
  return loadPromise;
}

function subscribeCeFlags(onStoreChange: () => void): () => void {
  window.addEventListener('docuvate-ce-flags', onStoreChange);
  return () => {
    window.removeEventListener('docuvate-ce-flags', onStoreChange);
  };
}

export function useCeFeatureFlags(): CeFeatureFlagsDto {
  return useSyncExternalStore(subscribeCeFlags, readCeFeatureFlags, () => CE_FLAGS_DEFAULT);
}

export function isCeSourceConnectorPlugin(pluginId: string): boolean {
  return isCeSourceConnectorPluginId(pluginId);
}
