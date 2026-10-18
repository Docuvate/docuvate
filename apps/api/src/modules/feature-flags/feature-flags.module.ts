// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { ResolveFeatureFlagsUseCase } from './application/resolve-feature-flags.use-case.js';
import { SetTenantFeatureFlagOverrideUseCase } from './application/set-tenant-feature-flag-override.use-case.js';
import { PgFeatureFlagRepository } from './infrastructure/pg-feature-flag.repository.js';
import { RemoteConfigController } from './presentation/remote-config.controller.js';

@Module({
  controllers: [RemoteConfigController],
  providers: [
    PgFeatureFlagRepository,
    ResolveFeatureFlagsUseCase,
    SetTenantFeatureFlagOverrideUseCase,
  ],
  exports: [
    ResolveFeatureFlagsUseCase,
    PgFeatureFlagRepository,
    SetTenantFeatureFlagOverrideUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class FeatureFlagsModule {}
