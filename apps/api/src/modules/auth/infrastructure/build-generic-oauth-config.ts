// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import type { InstallationOidcProviderRow } from '../domain/oidc-provider-row.js';
import { decryptOidcClientSecret } from './oidc-client-secret.codec.js';

function discoveryUrlForIssuer(issuer: string): string {
  const trimmed = issuer.replace(/\/+$/, '');
  return `${trimmed}/.well-known/openid-configuration`;
}

function scopesArray(scopes: string): string[] {
  return scopes
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function buildGenericOAuthPlugin(rows: InstallationOidcProviderRow[]) {
  const enabled = rows.filter((row) => row.enabled);
  if (enabled.length === 0) {
    return null;
  }
  return genericOAuth({
    config: enabled.map((row) => ({
      providerId: row.provider_id,
      name: row.display_name,
      discoveryUrl: discoveryUrlForIssuer(row.issuer),
      clientId: row.client_id,
      clientSecret: decryptOidcClientSecret(row.client_secret_encrypted),
      scopes: scopesArray(row.scopes),
    })),
  });
}
