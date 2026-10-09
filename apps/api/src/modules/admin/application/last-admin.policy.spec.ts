// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import { assertTargetIsNotLastAdministrator } from '../domain/last-admin.policy.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../auth/domain/installation.constants.js';

function mockPoolForLastAdmin(targetRole: string, adminCount: string) {
  const client = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return { rows: [] };
      }
      if (sql.includes('FOR UPDATE')) {
        return { rows: [] };
      }
      if (sql.includes('SELECT role FROM installation_user_roles')) {
        return { rows: [{ role: targetRole }] };
      }
      if (sql.includes('COUNT(*)')) {
        return { rows: [{ count: adminCount }] };
      }
      if (params?.[0] === INSTALLATION_DB_ROLE_ADMIN) {
        return { rows: [{ count: adminCount }] };
      }
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  return {
    connect: vi.fn().mockResolvedValue(client),
  };
}

describe('last administrator policy', () => {
  it('blocks demoting the sole administrator', async () => {
    const pool = mockPoolForLastAdmin(INSTALLATION_DB_ROLE_ADMIN, '1');
    await expect(
      assertTargetIsNotLastAdministrator(pool as never, 'user-1')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows demoting when another administrator exists', async () => {
    const pool = mockPoolForLastAdmin(INSTALLATION_DB_ROLE_ADMIN, '2');
    await expect(
      assertTargetIsNotLastAdministrator(pool as never, 'user-1')
    ).resolves.toBeUndefined();
  });
});
