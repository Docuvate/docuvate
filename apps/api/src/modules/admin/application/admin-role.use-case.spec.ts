// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { SetAdminUserRoleUseCase } from './admin.use-cases.js';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
} from '../../auth/domain/instance-role.constants.js';

describe('SetAdminUserRoleUseCase', () => {
  it('rejects self role change before touching infrastructure', async () => {
    const users = { setRole: vi.fn() };
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ role: 'installation_admin' }] }),
    } as never;
    const useCase = new SetAdminUserRoleUseCase(users as never, pool);

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
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ role: 'installation_admin' }] }),
    } as never;
    const useCase = new SetAdminUserRoleUseCase(users as never, pool);

    await useCase.execute({
      actorUserId: 'admin-1',
      headers: new Headers(),
      userId: 'admin-2',
      role: INSTANCE_ROLE_MEMBER,
    });

    expect(users.setRole).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      userId: 'admin-2',
      role: INSTANCE_ROLE_MEMBER,
    });
  });
});
