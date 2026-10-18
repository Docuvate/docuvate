// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord, parseBoolean, parseString } from '../../../shared/infrastructure/database/row-parse.js';

export interface EnvOidcProviderConfig {
  providerId: string;
  displayName: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  enabled: boolean;
}

const DEFAULT_SCOPES = 'openid email profile';

function parseEnvProviderEntry(value: unknown): EnvOidcProviderConfig | null {
  if (!isRecord(value)) {
    return null;
  }
  const providerId = parseString(value.providerId);
  const displayName = parseString(value.displayName);
  const issuer = parseString(value.issuer);
  const clientId = parseString(value.clientId);
  const clientSecret = parseString(value.clientSecret);
  const scopesRaw = parseString(value.scopes);
  const scopes = scopesRaw.length > 0 ? scopesRaw : DEFAULT_SCOPES;
  const enabled = value.enabled === undefined ? true : parseBoolean(value.enabled);
  if (!providerId || !displayName || !issuer || !clientId || !clientSecret) {
    return null;
  }
  return {
    providerId,
    displayName,
    issuer,
    clientId,
    clientSecret,
    scopes,
    enabled,
  };
}

export function loadOidcProvidersFromEnv(
  env: NodeJS.ProcessEnv = process.env
): EnvOidcProviderConfig[] {
  const raw = env['DOCUVATE_OIDC_PROVIDERS_JSON']?.trim();
  if (!raw) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const out: EnvOidcProviderConfig[] = [];
  for (const entry of parsed) {
    const provider = parseEnvProviderEntry(entry);
    if (provider) {
      out.push(provider);
    }
  }
  return out;
}
