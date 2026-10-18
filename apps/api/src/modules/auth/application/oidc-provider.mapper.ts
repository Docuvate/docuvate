// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AdminAuthSignInSettingsDto,
  AdminOidcProviderDto,
  AuthOidcProviderPublicDto,
  AuthSignInOptionsDto,
} from '@docuvate/contracts';

import type { InstallationOidcProviderRow } from '../domain/oidc-provider-row.js';
import { isEmailChangeMailAvailable } from '../infrastructure/mail/email-change-mailer.factory.js';

export function toOidcProviderPublicDto(row: InstallationOidcProviderRow): AuthOidcProviderPublicDto {
  return {
    providerId: row.provider_id,
    displayName: row.display_name,
  };
}

export function toAdminOidcProviderDto(row: InstallationOidcProviderRow): AdminOidcProviderDto {
  return {
    id: row.id,
    providerId: row.provider_id,
    displayName: row.display_name,
    issuer: row.issuer,
    clientId: row.client_id,
    scopes: row.scopes,
    enabled: row.enabled,
    source: row.source,
    hasClientSecret: row.client_secret_encrypted.length > 0,
  };
}

export function buildAuthSignInOptions(rows: InstallationOidcProviderRow[]): AuthSignInOptionsDto {
  return {
    passkeysEnabled: true,
    oidcProviders: rows.filter((row) => row.enabled).map(toOidcProviderPublicDto),
    emailChangeAvailable: isEmailChangeMailAvailable(),
  };
}

export function buildAdminAuthSignInSettings(
  rows: InstallationOidcProviderRow[]
): AdminAuthSignInSettingsDto {
  return {
    passkeysEnabled: true,
    oidcProviders: rows.map(toAdminOidcProviderDto),
  };
}
