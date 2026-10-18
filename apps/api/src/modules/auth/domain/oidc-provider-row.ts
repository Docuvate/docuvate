// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  parseBoolean,
  parseString,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';

export type OidcProviderSource = 'admin' | 'env';

export interface InstallationOidcProviderRow {
  id: string;
  provider_id: string;
  display_name: string;
  issuer: string;
  client_id: string;
  client_secret_encrypted: Buffer;
  scopes: string;
  enabled: boolean;
  source: OidcProviderSource;
}

function parseSource(value: unknown): OidcProviderSource {
  const raw = parseString(value);
  if (raw === 'env' || raw === 'admin') {
    return raw;
  }
  return 'admin';
}

export function oidcProviderRowFromUnknown(row: unknown): InstallationOidcProviderRow | null {
  const record = recordFromUnknown(row);
  if (!record) {
    return null;
  }
  const id = parseString(record['id']);
  const providerId = parseString(record['provider_id']);
  const displayName = parseString(record['display_name']);
  const issuer = parseString(record['issuer']);
  const clientId = parseString(record['client_id']);
  const secret = record['client_secret_encrypted'];
  const scopes = parseString(record['scopes']);
  const enabled = parseBoolean(record['enabled']);
  const source = parseSource(record['source']);
  if (
    !id ||
    !providerId ||
    !displayName ||
    !issuer ||
    !clientId ||
    !(secret instanceof Buffer) ||
    !scopes
  ) {
    return null;
  }
  return {
    id,
    provider_id: providerId,
    display_name: displayName,
    issuer,
    client_id: clientId,
    client_secret_encrypted: secret,
    scopes,
    enabled,
    source,
  };
}
