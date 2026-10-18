// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import { USER_ADMINISTRATION_PORT } from '../domain/user-administration.port.js';
import { BanAdminUserUseCase } from './admin.use-cases.js';

async function buildUseCase(users: {
  banUser: ReturnType<typeof vi.fn>;
  revokeSessions: ReturnType<typeof vi.fn>;
}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      BanAdminUserUseCase,
      { provide: USER_ADMINISTRATION_PORT, useValue: users },
    ],
  }).compile();
  return moduleRef.get(BanAdminUserUseCase);
}

describe('BanAdminUserUseCase', () => {
  it('rejects self-ban before touching infrastructure', async () => {
    const users = {
      banUser: vi.fn(),
      revokeSessions: vi.fn(),
    };
    const useCase = await buildUseCase(users);

    await expect(
      useCase.execute({
        actorUserId: 'same-user',
        headers: new Headers(),
        userId: 'same-user',
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(users.banUser).not.toHaveBeenCalled();
    expect(users.revokeSessions).not.toHaveBeenCalled();
  });

  it('revokes sessions immediately after ban', async () => {
    const users = {
      banUser: vi.fn().mockResolvedValue(undefined),
      revokeSessions: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = await buildUseCase(users);

    await useCase.execute({
      actorUserId: 'admin-1',
      headers: new Headers(),
      userId: 'member-1',
      reason: 'policy',
    });

    expect(users.banUser).toHaveBeenCalledOnce();
    expect(users.revokeSessions).not.toHaveBeenCalled();
  });
});
