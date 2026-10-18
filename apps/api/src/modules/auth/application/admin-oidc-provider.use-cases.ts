// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AdminOidcProviderDto,
  CreateAdminOidcProviderRequest,
  UpdateAdminOidcProviderRequest,
} from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import { invalidateAuthRuntime } from '../../../shared/infrastructure/auth/better-auth.config.js';
import { PgInstallationOidcProviderRepository } from '../infrastructure/pg-installation-oidc-provider.repository.js';
import { toAdminOidcProviderDto } from './oidc-provider.mapper.js';

@Injectable()
export class CreateAdminOidcProviderUseCase {
  constructor(private readonly oidcProviders: PgInstallationOidcProviderRepository) {}

  async execute(input: CreateAdminOidcProviderRequest): Promise<AdminOidcProviderDto> {
    const row = await this.oidcProviders.create({
      providerId: input.providerId,
      displayName: input.displayName,
      issuer: input.issuer,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      scopes: input.scopes,
      enabled: input.enabled,
      source: 'admin',
    });
    await invalidateAuthRuntime();
    return toAdminOidcProviderDto(row);
  }
}

@Injectable()
export class UpdateAdminOidcProviderUseCase {
  constructor(private readonly oidcProviders: PgInstallationOidcProviderRepository) {}

  async execute(id: string, input: UpdateAdminOidcProviderRequest): Promise<AdminOidcProviderDto> {
    const row = await this.oidcProviders.updateAdmin(id, input);
    if (!row) {
      throw new NotFoundError('OIDC provider');
    }
    await invalidateAuthRuntime();
    return toAdminOidcProviderDto(row);
  }
}

@Injectable()
export class DeleteAdminOidcProviderUseCase {
  constructor(private readonly oidcProviders: PgInstallationOidcProviderRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.oidcProviders.deleteAdmin(id);
    if (!deleted) {
      throw new NotFoundError('OIDC provider');
    }
    await invalidateAuthRuntime();
  }
}
