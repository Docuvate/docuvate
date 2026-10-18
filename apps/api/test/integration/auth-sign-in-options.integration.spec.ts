// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../../src/app.module.js';
import { encryptOidcClientSecret } from '../../src/modules/auth/infrastructure/oidc-client-secret.codec.js';
import { getIntegrationPool } from './pg-pool.js';

describe('GET /v1/auth/sign-in-options (integration)', () => {
  const pool = getIntegrationPool();
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication(new FastifyAdapter());
    app.setGlobalPrefix('v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists enabled OIDC providers for the login UI', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/sign-in-options',
    });
    expect(response.statusCode).toBe(200);
    const body: unknown = response.json();
    expect(body).toMatchObject({
      passkeysEnabled: true,
      oidcProviders: [{ providerId: 'authentik', displayName: 'Authentik' }],
    });
  });
});
