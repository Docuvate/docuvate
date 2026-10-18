// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';

function envFlagEnabled(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function envFlagEnabledDefaultTrue(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return true;
  }
  if (raw === '0' || raw === 'false' || raw === 'no') {
    return false;
  }
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** Installation-wide defaults when a tenant has no override row. */
export function readFeatureFlagDefaultsFromEnv(): FeatureFlagsDto {
  return {
    layoutReconstructionCompare: envFlagEnabled('DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'),
    sourceConnectors: envFlagEnabled('DOCUVATE_FEATURE_SOURCE_CONNECTORS'),
    experimentalResearchModels: envFlagEnabled('DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'),
    exactAnswers: envFlagEnabled('DOCUVATE_FEATURE_EXACT_ANSWERS'),
    smartDuplicates: envFlagEnabled('DOCUVATE_FEATURE_SMART_DUPLICATES'),
    answerAbstention: envFlagEnabled('DOCUVATE_FEATURE_ANSWER_ABSTENTION'),
    learnedValueTypes: envFlagEnabledDefaultTrue('DOCUVATE_FEATURE_LEARNED_VALUE_TYPES'),
    layoutKeyValueRoles: envFlagEnabled('DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES'),
    localChatModel: envFlagEnabled('DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'),
  };
}
