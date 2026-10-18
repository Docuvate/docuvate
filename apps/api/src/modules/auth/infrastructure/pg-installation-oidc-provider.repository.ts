// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  type InstallationOidcProviderRow,
  oidcProviderRowFromUnknown,
} from '../domain/oidc-provider-row.js';
import type { EnvOidcProviderConfig } from './load-oidc-env-providers.js';
import { decryptOidcClientSecret, encryptOidcClientSecret } from './oidc-client-secret.codec.js';

export interface UpsertOidcProviderInput {
  providerId: string;
  displayName: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  enabled: boolean;
  source: 'admin' | 'env';
}

@Injectable()
export class PgInstallationOidcProviderRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listAll(): Promise<InstallationOidcProviderRow[]> {
    const result = await this.pool.query(
      `SELECT id, provider_id, display_name, issuer, client_id, client_secret_encrypted,
              scopes, enabled, source
       FROM installation_oidc_provider
       ORDER BY provider_id ASC`
    );
    return result.rows
      .map((row) => oidcProviderRowFromUnknown(row))
      .filter((row): row is InstallationOidcProviderRow => row != null);
  }

  async listEnabled(): Promise<InstallationOidcProviderRow[]> {
    const rows = await this.listAll();
    return rows.filter((row) => row.enabled);
  }

  async findById(id: string): Promise<InstallationOidcProviderRow | null> {
    const result = await this.pool.query(
      `SELECT id, provider_id, display_name, issuer, client_id, client_secret_encrypted,
              scopes, enabled, source
       FROM installation_oidc_provider
       WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? oidcProviderRowFromUnknown(row) : null;
  }

  async create(input: UpsertOidcProviderInput): Promise<InstallationOidcProviderRow> {
    const encrypted = encryptOidcClientSecret(input.clientSecret);
    const result = await this.pool.query(
      `INSERT INTO installation_oidc_provider (
         provider_id, display_name, issuer, client_id, client_secret_encrypted, scopes, enabled, source
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, provider_id, display_name, issuer, client_id, client_secret_encrypted,
                 scopes, enabled, source`,
      [
        input.providerId,
        input.displayName,
        input.issuer,
        input.clientId,
        encrypted,
        input.scopes,
        input.enabled,
        input.source,
      ]
    );
    const row = oidcProviderRowFromUnknown(result.rows[0]);
    if (!row) {
      throw new Error('Failed to read inserted OIDC provider row');
    }
    return row;
  }

  async updateAdmin(
    id: string,
    input: {
      displayName: string;
      issuer: string;
      clientId: string;
      scopes: string;
      enabled: boolean;
      clientSecret?: string;
    }
  ): Promise<InstallationOidcProviderRow | null> {
    const encrypted =
      input.clientSecret !== undefined ? encryptOidcClientSecret(input.clientSecret) : null;
    const result = await this.pool.query(
      `UPDATE installation_oidc_provider
       SET display_name = $2,
           issuer = $3,
           client_id = $4,
           client_secret_encrypted = COALESCE($5, client_secret_encrypted),
           scopes = $6,
           enabled = $7,
           updated_at = now()
       WHERE id = $1 AND source = 'admin'
       RETURNING id, provider_id, display_name, issuer, client_id, client_secret_encrypted,
                 scopes, enabled, source`,
      [
        id,
        input.displayName,
        input.issuer,
        input.clientId,
        encrypted,
        input.scopes,
        input.enabled,
      ]
    );
    const row = result.rows[0];
    return row ? oidcProviderRowFromUnknown(row) : null;
  }

  async upsertEnv(input: EnvOidcProviderConfig): Promise<void> {
    const encrypted = encryptOidcClientSecret(input.clientSecret);
    await this.pool.query(
      `INSERT INTO installation_oidc_provider (
         provider_id, display_name, issuer, client_id, client_secret_encrypted, scopes, enabled, source
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'env')
       ON CONFLICT (provider_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         issuer = EXCLUDED.issuer,
         client_id = EXCLUDED.client_id,
         client_secret_encrypted = EXCLUDED.client_secret_encrypted,
         scopes = EXCLUDED.scopes,
         enabled = EXCLUDED.enabled,
         source = 'env',
         updated_at = now()
       WHERE installation_oidc_provider.source = 'env'`,
      [
        input.providerId,
        input.displayName,
        input.issuer,
        input.clientId,
        encrypted,
        input.scopes,
        input.enabled,
      ]
    );
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM installation_oidc_provider WHERE id = $1 AND source = 'admin'`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  clientSecretPlain(row: InstallationOidcProviderRow): string {
    return decryptOidcClientSecret(row.client_secret_encrypted);
  }
}
