// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FeatureFlagKey, FeatureFlagsDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { FEATURE_FLAG_DB_KEYS } from '../domain/feature-flag-keys.js';
import { PgFeatureFlagRepository } from '../infrastructure/pg-feature-flag.repository.js';
import { ResolveFeatureFlagsUseCase } from './resolve-feature-flags.use-case.js';

@Injectable()
export class SetTenantFeatureFlagOverrideUseCase {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly repository: PgFeatureFlagRepository,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  async execute(input: {
    tenantId: string;
    flag: FeatureFlagKey;
    enabled: boolean;
  }): Promise<FeatureFlagsDto> {
    await this.assertTenantExists(input.tenantId);
    await this.repository.upsertOverride(
      input.tenantId,
      FEATURE_FLAG_DB_KEYS[input.flag],
      input.enabled
    );
    return await this.resolveFeatureFlags.execute(input.tenantId);
  }

  private async assertTenantExists(tenantId: string): Promise<void> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM "user" WHERE id = $1) AS exists`,
      [tenantId]
    );
    if (!result.rows[0]?.exists) {
      throw new NotFoundError('User not found');
    }
  }
}
