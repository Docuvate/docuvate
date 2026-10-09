// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { ValidationError } from '../../../shared/domain/errors.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type {
  ConnectorInstallationRepository,
  CreateConnectorInstallationInput,
} from '../domain/connector.ports.js';
import type { ConnectorInstallationEntity, ConnectorPluginId } from '../domain/connector.types.js';
import {
  decryptConnectorCredentials,
  encryptConnectorCredentials,
} from './connector-secrets.codec.js';

interface InstallationRow {
  id: string;
  user_id: string;
  plugin_id: string;
  display_name: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface InstallationWithCredentialsRow extends InstallationRow {
  credentials_encrypted: Buffer;
}

function mapRow(row: InstallationRow): ConnectorInstallationEntity {
  return {
    id: row.id,
    userId: row.user_id,
    pluginId: row.plugin_id as ConnectorPluginId,
    displayName: row.display_name,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PgConnectorInstallationRepository implements ConnectorInstallationRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async findByIdForUser(
    userId: string,
    installationId: string
  ): Promise<import('../domain/connector.ports.js').ConnectorInstallationRecord | null> {
    const result = await this.pool.query<InstallationWithCredentialsRow>(
      `SELECT id, user_id, plugin_id, display_name, enabled, created_at, updated_at, credentials_encrypted
       FROM connector_installations
       WHERE id = $1 AND user_id = $2`,
      [installationId, userId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      ...mapRow(row),
      credentials: decryptConnectorCredentials(row.credentials_encrypted),
    };
  }

  async listForUser(userId: string): Promise<ConnectorInstallationEntity[]> {
    const result = await this.pool.query<InstallationRow>(
      `SELECT id, user_id, plugin_id, display_name, enabled, created_at, updated_at
       FROM connector_installations
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows.map(mapRow);
  }

  async create(input: CreateConnectorInstallationInput): Promise<ConnectorInstallationEntity> {
    const id = randomUUID();
    const encrypted = encryptConnectorCredentials(input.credentials);
    try {
      const result = await this.pool.query<InstallationRow>(
        `INSERT INTO connector_installations (
           id, user_id, plugin_id, display_name, enabled, credentials_encrypted
         ) VALUES ($1, $2, $3, $4, true, $5)
         RETURNING id, user_id, plugin_id, display_name, enabled, created_at, updated_at`,
        [id, input.userId, input.pluginId, input.displayName, encrypted]
      );
      const row = mapRow(result.rows[0]!);
      if (input.pluginId === 'paperless') {
        await this.pool.query(
          `INSERT INTO connector_paperless_settings (installation_id) VALUES ($1)
           ON CONFLICT (installation_id) DO NOTHING`,
          [id]
        );
      }
      return row;
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? err.code : null;
      if (code === '23505') {
        throw new ValidationError('Connector already installed for this plugin');
      }
      throw err;
    }
  }

  async updateCredentials(
    userId: string,
    installationId: string,
    credentials: import('../domain/connector.types.js').ConnectorConfigurationInput
  ): Promise<void> {
    const encrypted = encryptConnectorCredentials(credentials);
    await this.pool.query(
      `UPDATE connector_installations
       SET credentials_encrypted = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [installationId, userId, encrypted]
    );
  }

  async updateDisplayName(
    userId: string,
    installationId: string,
    displayName: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE connector_installations
       SET display_name = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [installationId, userId, displayName]
    );
  }

  async deleteForUser(userId: string, installationId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM connector_installations
       WHERE id = $1 AND user_id = $2`,
      [installationId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteForUserByPlugin(userId: string, pluginId: ConnectorPluginId): Promise<void> {
    await this.pool.query(
      `DELETE FROM connector_installations
       WHERE user_id = $1 AND plugin_id = $2`,
      [userId, pluginId]
    );
  }
}
