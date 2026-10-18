// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminAuthSignInSettingsDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PgInstallationOidcProviderRepository } from '../infrastructure/pg-installation-oidc-provider.repository.js';
import { buildAdminAuthSignInSettings } from './oidc-provider.mapper.js';

@Injectable()
export class GetAdminAuthSignInSettingsUseCase {
  constructor(private readonly oidcProviders: PgInstallationOidcProviderRepository) {}

  async execute(): Promise<AdminAuthSignInSettingsDto> {
    const rows = await this.oidcProviders.listAll();
    return buildAdminAuthSignInSettings(rows);
  }
}
