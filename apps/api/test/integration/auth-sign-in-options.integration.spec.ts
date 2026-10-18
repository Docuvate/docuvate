// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Global, Module } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AuthPublicModule } from '../../src/modules/auth/auth-public.module.js';
import { encryptOidcClientSecret } from '../../src/modules/auth/infrastructure/oidc-client-secret.codec.js';
import { PG_POOL } from '../../src/shared/infrastructure/database/tokens.js';
import { getIntegrationPool } from './pg-pool.js';

function testPgPoolModule(pool: pg.Pool) {
  @Global()
  @Module({
    providers: [{ provide: PG_POOL, useValue: pool }],
    exports: [PG_POOL],
  })
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
  class TestPgPoolModule {}

  return TestPgPoolModule;
}

describe('GET /v1/auth/sign-in-options (integration)', () => {
  const pool = getIntegrationPool();
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [testPgPoolModule(pool), AuthPublicModule],
    }).compile();
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
