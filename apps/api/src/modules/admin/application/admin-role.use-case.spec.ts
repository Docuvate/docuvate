// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import { stubPgPool } from '../../../shared/infrastructure/database/pg-pool.spec-util.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { INSTANCE_ROLE_MEMBER } from '../../auth/domain/instance-role.constants.js';
import { USER_ADMINISTRATION_PORT } from '../domain/user-administration.port.js';
import { SetAdminUserRoleUseCase } from './admin.use-cases.js';

async function buildUseCase(
  users: { setRole: ReturnType<typeof vi.fn> },
  pool: ReturnType<typeof stubPgPool>
) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      SetAdminUserRoleUseCase,
      { provide: USER_ADMINISTRATION_PORT, useValue: users },
      { provide: PG_POOL, useValue: pool },
    ],
  }).compile();
  return moduleRef.get(SetAdminUserRoleUseCase);
}

describe('SetAdminUserRoleUseCase', () => {
  it('rejects self role change before touching infrastructure', async () => {
    const users = { setRole: vi.fn() };
    const pool = stubPgPool({
      query: vi.fn().mockResolvedValue({ rows: [{ role: 'installation_admin' }] }),
    });
    const useCase = await buildUseCase(users, pool);

    await expect(
      useCase.execute({
        actorUserId: 'same-user',
        headers: new Headers(),
        userId: 'same-user',
        role: INSTANCE_ROLE_MEMBER,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(users.setRole).not.toHaveBeenCalled();
  });

  it('applies role change when actor and target differ', async () => {
    const users = { setRole: vi.fn().mockResolvedValue(undefined) };
    const pool = stubPgPool({
      query: vi.fn().mockResolvedValue({ rows: [{ role: 'installation_admin' }] }),
    });
    const useCase = await buildUseCase(users, pool);
    const headers = new Headers();

    await useCase.execute({
      actorUserId: 'admin-1',
      headers,
      userId: 'admin-2',
      role: INSTANCE_ROLE_MEMBER,
    });

    expect(users.setRole).toHaveBeenCalledWith({
      headers,
      userId: 'admin-2',
      role: INSTANCE_ROLE_MEMBER,
    });
  });
});
