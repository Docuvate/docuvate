// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { loadOidcProvidersFromEnv } from './load-oidc-env-providers.js';

describe('loadOidcProvidersFromEnv', () => {
  it('returns empty list when unset', () => {
    expect(loadOidcProvidersFromEnv({})).toEqual([]);
  });

  it('parses valid provider entries', () => {
    const env = {
      DOCUVATE_OIDC_PROVIDERS_JSON: JSON.stringify([
        {
          providerId: 'authentik',
          displayName: 'Authentik',
          issuer: 'https://auth.example.com/application/o/docuvate/',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
      ]),
    };
    const providers = loadOidcProvidersFromEnv(env);
    expect(providers).toHaveLength(1);
    expect(providers[0]?.providerId).toBe('authentik');
    expect(providers[0]?.scopes).toBe('openid email profile');
    expect(providers[0]?.enabled).toBe(true);
  });

  it('ignores invalid JSON', () => {
    expect(
      loadOidcProvidersFromEnv({ DOCUVATE_OIDC_PROVIDERS_JSON: '{not-json' })
    ).toEqual([]);
  });
});
