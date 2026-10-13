// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionEngineInfo } from '@docuvate/contracts';

import { ceFeatureFlags } from '../../../shared/application/assert-ce-feature.js';

const CE_DEFAULT_EXTRACTOR_ID = 'pipeline';

export function filterExtractionEnginesForCe(engines: ExtractionEngineInfo[]): ExtractionEngineInfo[] {
  if (ceFeatureFlags().experimentalResearchModels) {
    return engines;
  }
  const pipeline = engines.filter((engine) => engine.id === CE_DEFAULT_EXTRACTOR_ID);
  if (pipeline.length > 0) {
    return pipeline;
  }
  return engines.slice(0, 1);
}
