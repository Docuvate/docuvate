// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AuthSignInOptionsDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PgInstallationOidcProviderRepository } from '../infrastructure/pg-installation-oidc-provider.repository.js';
import { buildAuthSignInOptions } from './oidc-provider.mapper.js';

@Injectable()
export class GetAuthSignInOptionsUseCase {
  constructor(private readonly oidcProviders: PgInstallationOidcProviderRepository) {}

  async execute(): Promise<AuthSignInOptionsDto> {
    const rows = await this.oidcProviders.listEnabled();
    return buildAuthSignInOptions(rows);
  }
}
