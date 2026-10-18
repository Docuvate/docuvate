// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { GetAuthSignInOptionsUseCase } from '../../src/modules/auth/application/get-auth-sign-in-options.use-case.js';
import { encryptOidcClientSecret } from '../../src/modules/auth/infrastructure/oidc-client-secret.codec.js';
import { PgInstallationOidcProviderRepository } from '../../src/modules/auth/infrastructure/pg-installation-oidc-provider.repository.js';
import { getIntegrationPool } from './pg-pool.js';

describe('GetAuthSignInOptionsUseCase (integration)', () => {
  const pool = getIntegrationPool();

  it('lists enabled OIDC providers for the login UI', async () => {
    await pool.query(`DELETE FROM installation_oidc_provider`);
    await pool.query(
      `INSERT INTO installation_oidc_provider (
         provider_id, display_name, issuer, client_id, client_secret_encrypted, scopes, enabled, source
       ) VALUES ($1, $2, $3, $4, $5, $6, true, 'admin')`,
      [
        'authentik',
        'Authentik',
        'https://auth.example.com/application/o/docuvate/',
        'client-id',
        encryptOidcClientSecret('secret'),
        'openid email profile',
      ]
    );

    const useCase = new GetAuthSignInOptionsUseCase(new PgInstallationOidcProviderRepository(pool));
    const options = await useCase.execute();

    expect(options).toMatchObject({
      passkeysEnabled: true,
      oidcProviders: [{ providerId: 'authentik', displayName: 'Authentik' }],
    });
  });
});
