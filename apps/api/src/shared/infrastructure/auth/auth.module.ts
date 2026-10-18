// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';

import { InstallationMembershipService } from '../../../modules/auth/infrastructure/installation-membership.service.js';
import { AdminGuard } from './admin.guard.js';
import { AuthGuard } from './auth.guard.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';

@Global()
@Module({
  providers: [ServiceApiKeyRegistry, InstallationMembershipService, AuthGuard, AdminGuard],
  exports: [ServiceApiKeyRegistry, InstallationMembershipService, AuthGuard, AdminGuard],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AuthModule {}
