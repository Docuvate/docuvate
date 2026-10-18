// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  createStubPoolClientWithQueryMock,
  stubPgPoolWithClient,
} from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../auth/domain/installation.constants.js';
import { assertTargetIsNotLastAdministrator } from '../domain/last-admin.policy.js';

function mockPoolForLastAdmin(targetRole: string, adminCount: string) {
  const emptyResult = { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  const { client } = createStubPoolClientWithQueryMock(
    vi.fn((queryTextOrConfig: string | pg.QueryConfig, values?: unknown[]) => {
      const sql =
        typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text;
      const params = values;
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return Promise.resolve(emptyResult);
      }
      if (sql.includes('FOR UPDATE')) {
        return Promise.resolve(emptyResult);
      }
      if (sql.includes('SELECT role FROM installation_user_roles')) {
        return Promise.resolve({ ...emptyResult, rows: [{ role: targetRole }] });
      }
      if (sql.includes('COUNT(*)')) {
        return Promise.resolve({ ...emptyResult, rows: [{ count: adminCount }] });
      }
      if (params?.[0] === INSTALLATION_DB_ROLE_ADMIN) {
        return Promise.resolve({ ...emptyResult, rows: [{ count: adminCount }] });
      }
      return Promise.resolve(emptyResult);
    })
  );
  return stubPgPoolWithClient(client);
}

describe('last administrator policy', () => {
  it('blocks demoting the sole administrator', async () => {
    const pool = mockPoolForLastAdmin(INSTALLATION_DB_ROLE_ADMIN, '1');
    await expect(assertTargetIsNotLastAdministrator(pool, 'user-1')).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('allows demoting when another administrator exists', async () => {
    const pool = mockPoolForLastAdmin(INSTALLATION_DB_ROLE_ADMIN, '2');
    await expect(assertTargetIsNotLastAdministrator(pool, 'user-1')).resolves.toBeUndefined();
  });
});
