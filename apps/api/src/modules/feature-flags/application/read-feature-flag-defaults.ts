// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagsDto } from '@docuvate/contracts';

function envFlagEnabled(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** Installation-wide defaults when a tenant has no override row. */
export function readFeatureFlagDefaultsFromEnv(): FeatureFlagsDto {
  return {
    layoutReconstructionCompare: envFlagEnabled('DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'),
    sourceConnectors: envFlagEnabled('DOCUVATE_FEATURE_SOURCE_CONNECTORS'),
    experimentalResearchModels: envFlagEnabled('DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'),
  };
}
