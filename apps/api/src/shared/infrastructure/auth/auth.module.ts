// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';
import { AuthGuard } from './auth.guard.js';
import { ServiceApiKeyRegistry } from './service-api-key.registry.js';
import { InstallationMembershipService } from '../../../modules/auth/infrastructure/installation-membership.service.js';

@Global()
@Module({
  providers: [ServiceApiKeyRegistry, InstallationMembershipService, AuthGuard, AdminGuard],
  exports: [ServiceApiKeyRegistry, InstallationMembershipService, AuthGuard, AdminGuard],
})
export class AuthModule {}
