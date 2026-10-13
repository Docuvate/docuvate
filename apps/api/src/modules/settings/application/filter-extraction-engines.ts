// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionEngineInfo, FeatureFlagsDto } from '@docuvate/contracts';

const DEFAULT_EXTRACTOR_ID = 'pipeline';

export function filterExtractionEngines(
  engines: ExtractionEngineInfo[],
  featureFlags: FeatureFlagsDto
): ExtractionEngineInfo[] {
  if (featureFlags.experimentalResearchModels) {
    return engines;
  }
  const pipeline = engines.filter((engine) => engine.id === DEFAULT_EXTRACTOR_ID);
  if (pipeline.length > 0) {
    return pipeline;
  }
  return engines.slice(0, 1);
}
