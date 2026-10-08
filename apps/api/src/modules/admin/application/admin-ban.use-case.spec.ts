import { describe, expect, it, vi } from 'vitest';
import { BanAdminUserUseCase } from './admin.use-cases.js';
import { ForbiddenError } from '../../../shared/domain/errors.js';

describe('BanAdminUserUseCase', () => {
  it('rejects self-ban before touching infrastructure', async () => {
    const users = {
      banUser: vi.fn(),
      revokeSessions: vi.fn(),
    };
    const useCase = new BanAdminUserUseCase(users as never);

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
    const useCase = new BanAdminUserUseCase(users as never);

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
