// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey, FeatureFlagsDto } from '@docuvate/contracts';

export const FEATURE_FLAG_DB_KEYS: Record<FeatureFlagKey, string> = {
  layoutReconstructionCompare: 'layout_reconstruction_compare',
  sourceConnectors: 'source_connectors',
  experimentalResearchModels: 'experimental_research_models',
  exactAnswers: 'exact_answers',
  smartDuplicates: 'smart_duplicates',
  answerAbstention: 'answer_abstention',
  learnedValueTypes: 'learned_value_types',
  layoutKeyValueRoles: 'layout_key_value_roles',
  localChatModel: 'local_chat_model',
};

export const FEATURE_FLAG_KEYS_ORDERED: FeatureFlagKey[] = [
  'layoutReconstructionCompare',
  'sourceConnectors',
  'experimentalResearchModels',
  'exactAnswers',
  'smartDuplicates',
  'answerAbstention',
  'learnedValueTypes',
  'layoutKeyValueRoles',
  'localChatModel',
];

export function mergeFeatureFlags(
  defaults: FeatureFlagsDto,
  overrides: Map<string, boolean>
): FeatureFlagsDto {
  const merged: FeatureFlagsDto = { ...defaults };
  for (const key of FEATURE_FLAG_KEYS_ORDERED) {
    const override = overrides.get(FEATURE_FLAG_DB_KEYS[key]);
    if (override !== undefined) {
      merged[key] = override;
    }
  }
  return merged;
}
