import { describe, expect, it, vi } from 'vitest';
import { AdminResetPasswordUseCase } from './admin-reset-password.use-case.js';

describe('AdminResetPasswordUseCase', () => {
  it('updates credential password via better-auth context', async () => {
    const updatePassword = vi.fn(async () => undefined);
    const findCredentialAccount = vi.fn(async () => ({ id: 'acc-1', password: 'old' }));
    const hash = vi.fn(async () => 'hashed');
    const findUserByEmail = vi.fn(async () => ({
      user: { id: 'user-1', email: 'a@b.com' },
    }));

    const useCase = new AdminResetPasswordUseCase(async () => ({
      internalAdapter: {
        findUserByEmail,
        findCredentialAccount,
        updatePassword,
        createAccount: vi.fn(),
        deleteUserSessions: vi.fn(),
      },
      password: { hash },
    }));
    await useCase.execute({
      email: 'a@b.com',
      newPassword: 'long-enough-secret',
      revokeSessions: false,
    });

    expect(hash).toHaveBeenCalledWith('long-enough-secret');
    expect(updatePassword).toHaveBeenCalledWith('user-1', 'hashed');
  });
});
