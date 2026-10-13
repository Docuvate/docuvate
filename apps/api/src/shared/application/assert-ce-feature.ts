// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CeFeatureFlagsDto } from '@docuvate/contracts';

import { ForbiddenError } from '../domain/errors.js';
import { readCeFeatureFlagsFromEnv } from './ce-feature-flags.js';

export type CeFeatureKey = keyof CeFeatureFlagsDto;

export function ceFeatureFlags(): CeFeatureFlagsDto {
  return readCeFeatureFlagsFromEnv();
}

export function assertCeFeatureEnabled(feature: CeFeatureKey): void {
  const flags = ceFeatureFlags();
  if (!flags[feature]) {
    throw new ForbiddenError(`CE feature disabled: ${feature}`);
  }
}
