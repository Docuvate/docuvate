// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { listPendingDatabaseMigrationNames } from '../../src/shared/infrastructure/database/list-pending-database-migrations.js';

describe('database migration readiness (Testcontainers Postgres)', () => {
  it('reports no pending migrations after CI migrate', async () => {
    const pending = await listPendingDatabaseMigrationNames();
    expect(pending).toEqual([]);
  });
});
