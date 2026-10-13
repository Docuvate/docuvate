// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey, FeatureFlagsDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import { mergeFeatureFlags } from '../domain/feature-flag-keys.js';
import { PgFeatureFlagRepository } from '../infrastructure/pg-feature-flag.repository.js';
import { readFeatureFlagDefaultsFromEnv } from './read-feature-flag-defaults.js';

@Injectable()
export class ResolveFeatureFlagsUseCase {
  constructor(private readonly repository: PgFeatureFlagRepository) {}

  async execute(tenantId: string): Promise<FeatureFlagsDto> {
    const defaults = readFeatureFlagDefaultsFromEnv();
    const overrides = await this.repository.listOverridesForTenant(tenantId);
    return mergeFeatureFlags(defaults, overrides);
  }

  async assertEnabled(tenantId: string, feature: FeatureFlagKey): Promise<void> {
    const flags = await this.execute(tenantId);
    if (!flags[feature]) {
      throw new ForbiddenError(`Feature disabled: ${feature}`);
    }
  }
}
