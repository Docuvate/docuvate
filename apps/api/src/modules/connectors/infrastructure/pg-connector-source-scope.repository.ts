// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorSourceScopeDto, ConnectorSourceScopeMode } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function normalizeScope(input: ConnectorSourceScopeDto): ConnectorSourceScopeDto {
  const mode: ConnectorSourceScopeMode = input.mode === 'selected' ? 'selected' : 'all';
  if (mode === 'all') {
    return { mode: 'all', paths: [] };
  }
  const paths = [...new Set(input.paths.map((p) => p.trim()).filter((p) => p.length > 0))];
  return { mode: 'selected', paths };
}

@Injectable()
export class PgConnectorSourceScopeRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async getScope(installationId: string): Promise<ConnectorSourceScopeDto> {
    const scopeResult = await this.pool.query<{ mode: ConnectorSourceScopeMode }>(
      `SELECT mode FROM connector_installation_source_scope WHERE installation_id = $1`,
      [installationId]
    );
    const mode = scopeResult.rows.at(0)?.mode ?? 'all';
    if (mode === 'all') {
      return { mode: 'all', paths: [] };
    }
    const pathsResult = await this.pool.query<{ path: string }>(
      `SELECT path FROM connector_installation_source_paths
       WHERE installation_id = $1
       ORDER BY path ASC`,
      [installationId]
    );
    return { mode: 'selected', paths: pathsResult.rows.map((row) => row.path) };
  }

  async getScopesForInstallations(
    installationIds: string[]
  ): Promise<Map<string, ConnectorSourceScopeDto>> {
    const map = new Map<string, ConnectorSourceScopeDto>();
    if (installationIds.length === 0) {
      return map;
    }
    const scopeRows = await this.pool.query<{ installation_id: string; mode: ConnectorSourceScopeMode }>(
      `SELECT installation_id, mode FROM connector_installation_source_scope
       WHERE installation_id = ANY($1::uuid[])`,
      [installationIds]
    );
    for (const row of scopeRows.rows) {
      map.set(row.installation_id, { mode: row.mode, paths: [] });
    }
    const pathRows = await this.pool.query<{ installation_id: string; path: string }>(
      `SELECT installation_id, path FROM connector_installation_source_paths
       WHERE installation_id = ANY($1::uuid[])
       ORDER BY path ASC`,
      [installationIds]
    );
    for (const row of pathRows.rows) {
      const current = map.get(row.installation_id) ?? { mode: 'selected' as const, paths: [] };
      current.paths.push(row.path);
      map.set(row.installation_id, current);
    }
    for (const id of installationIds) {
      if (!map.has(id)) {
        map.set(id, { mode: 'all', paths: [] });
      }
    }
    return map;
  }

  async setScope(installationId: string, input: ConnectorSourceScopeDto): Promise<void> {
    const scope = normalizeScope(input);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO connector_installation_source_scope (installation_id, mode)
         VALUES ($1, $2)
         ON CONFLICT (installation_id) DO UPDATE SET mode = EXCLUDED.mode`,
        [installationId, scope.mode]
      );
      await client.query(`DELETE FROM connector_installation_source_paths WHERE installation_id = $1`, [
        installationId,
      ]);
      if (scope.mode === 'selected') {
        for (const path of scope.paths) {
          await client.query(
            `INSERT INTO connector_installation_source_paths (installation_id, path) VALUES ($1, $2)`,
            [installationId, path]
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
