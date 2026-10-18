// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  CreateAdminOidcProviderUseCase,
  DeleteAdminOidcProviderUseCase,
  UpdateAdminOidcProviderUseCase,
} from './application/admin-oidc-provider.use-cases.js';
import { GetAdminAuthSignInSettingsUseCase } from './application/get-admin-auth-sign-in-settings.use-case.js';
import { GetAuthSignInOptionsUseCase } from './application/get-auth-sign-in-options.use-case.js';
import { PgInstallationOidcProviderRepository } from './infrastructure/pg-installation-oidc-provider.repository.js';

@Module({
  providers: [
    PgInstallationOidcProviderRepository,
    GetAuthSignInOptionsUseCase,
    GetAdminAuthSignInSettingsUseCase,
    CreateAdminOidcProviderUseCase,
    UpdateAdminOidcProviderUseCase,
    DeleteAdminOidcProviderUseCase,
  ],
  exports: [
    GetAuthSignInOptionsUseCase,
    GetAdminAuthSignInSettingsUseCase,
    CreateAdminOidcProviderUseCase,
    UpdateAdminOidcProviderUseCase,
    DeleteAdminOidcProviderUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AuthOidcModule {}
