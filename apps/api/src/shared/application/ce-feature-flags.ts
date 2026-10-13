// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CeFeatureFlagsDto } from '@docuvate/contracts';

function envFlagEnabled(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** CE 0.1 core freeze: non-core capabilities default off unless env enables them. */
export function readCeFeatureFlagsFromEnv(): CeFeatureFlagsDto {
  return {
    layoutReconstructionCompare: envFlagEnabled(
      'DOCUVATE_CE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'
    ),
    sourceConnectors: envFlagEnabled('DOCUVATE_CE_FEATURE_SOURCE_CONNECTORS'),
    experimentalResearchModels: envFlagEnabled(
      'DOCUVATE_CE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'
    ),
  };
}
