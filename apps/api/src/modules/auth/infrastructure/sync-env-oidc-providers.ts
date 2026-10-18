// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import { loadOidcProvidersFromEnv } from './load-oidc-env-providers.js';
import { PgInstallationOidcProviderRepository } from './pg-installation-oidc-provider.repository.js';

export async function syncEnvOidcProviders(pool: pg.Pool): Promise<void> {
  const repo = new PgInstallationOidcProviderRepository(pool);
  const envProviders = loadOidcProvidersFromEnv();
  const envIds = new Set(envProviders.map((p) => p.providerId));
  const existing = await repo.listAll();
  for (const row of existing) {
    if (row.source === 'env' && !envIds.has(row.provider_id)) {
      await pool.query(`DELETE FROM installation_oidc_provider WHERE id = $1 AND source = 'env'`, [
        row.id,
      ]);
    }
  }
  for (const provider of envProviders) {
    await repo.upsertEnv(provider);
  }
}
