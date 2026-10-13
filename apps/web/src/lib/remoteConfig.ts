// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';
import { isSourceConnectorPluginId } from '@docuvate/contracts';
import { useSyncExternalStore } from 'react';

import { getRemoteConfig } from './api';

const FEATURE_FLAGS_DEFAULT: FeatureFlagsDto = {
  layoutReconstructionCompare: false,
  sourceConnectors: false,
  experimentalResearchModels: false,
  exactAnswers: false,
  smartDuplicates: false,
  answerAbstention: false,
  learnedValueTypes: false,
  layoutKeyValueRoles: false,
  localChatModel: false,
};

let cachedFlags: FeatureFlagsDto = FEATURE_FLAGS_DEFAULT;
let loadPromise: Promise<FeatureFlagsDto> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function readFeatureFlags(): FeatureFlagsDto {
  return cachedFlags;
}

export async function ensureRemoteConfigLoaded(): Promise<FeatureFlagsDto> {
  loadPromise ??= getRemoteConfig()
    .then((config) => {
      cachedFlags = config.featureFlags;
      emit();
      return cachedFlags;
    })
    .catch(() => {
      loadPromise = null;
      return cachedFlags;
    });
  return loadPromise;
}

function subscribeFeatureFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFeatureFlags(): FeatureFlagsDto {
  return useSyncExternalStore(subscribeFeatureFlags, readFeatureFlags, () => FEATURE_FLAGS_DEFAULT);
}

export function isSourceConnectorPlugin(pluginId: string): boolean {
  return isSourceConnectorPluginId(pluginId);
}
