// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey, FeatureFlagsDto } from '@docuvate/contracts';

export const FEATURE_FLAG_DB_KEYS: Record<FeatureFlagKey, string> = {
  layoutReconstructionCompare: 'layout_reconstruction_compare',
  sourceConnectors: 'source_connectors',
  experimentalResearchModels: 'experimental_research_models',
};

export const FEATURE_FLAG_KEYS_ORDERED: FeatureFlagKey[] = [
  'layoutReconstructionCompare',
  'sourceConnectors',
  'experimentalResearchModels',
];

export function mergeFeatureFlags(
  defaults: FeatureFlagsDto,
  overrides: Map<string, boolean>
): FeatureFlagsDto {
  return {
    layoutReconstructionCompare:
      overrides.get(FEATURE_FLAG_DB_KEYS.layoutReconstructionCompare) ??
      defaults.layoutReconstructionCompare,
    sourceConnectors:
      overrides.get(FEATURE_FLAG_DB_KEYS.sourceConnectors) ?? defaults.sourceConnectors,
    experimentalResearchModels:
      overrides.get(FEATURE_FLAG_DB_KEYS.experimentalResearchModels) ??
      defaults.experimentalResearchModels,
  };
}
