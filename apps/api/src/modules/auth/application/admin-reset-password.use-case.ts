// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../domain/auth-password.constants.js';

export type AdminResetPasswordInput = {
  email: string;
  newPassword: string;
  revokeSessions: boolean;
};

export type AdminResetPasswordAuthContext = {
  internalAdapter: {
    findUserByEmail(
      email: string,
      options?: { includeAccounts?: boolean }
    ): Promise<{ user: { id: string } } | null>;
    findCredentialAccount(userId: string): Promise<{ id: string } | null>;
    updatePassword(userId: string, hashedPassword: string): Promise<void>;
    createAccount(account: {
      userId: string;
      providerId: string;
      accountId: string;
      password: string;
    }): Promise<unknown>;
    deleteUserSessions(userId: string): Promise<void>;
  };
  password: {
    hash(password: string): Promise<string>;
  };
};

export class AdminResetPasswordUseCase {
  constructor(private readonly getContext: () => Promise<AdminResetPasswordAuthContext>) {}

  async execute(input: AdminResetPasswordInput): Promise<void> {
    assertPasswordLength(input.newPassword);

    const ctx = await this.getContext();
    const found = await ctx.internalAdapter.findUserByEmail(input.email.trim(), {
      includeAccounts: true,
    });
    if (!found) {
      throw new Error(`No user found for email: ${input.email}`);
    }

    const userId = found.user.id;
    const hashedPassword = await ctx.password.hash(input.newPassword);
    const credential = await ctx.internalAdapter.findCredentialAccount(userId);
    if (credential) {
      await ctx.internalAdapter.updatePassword(userId, hashedPassword);
    } else {
      await ctx.internalAdapter.createAccount({
        userId,
        providerId: 'credential',
        accountId: found.user.id,
        password: hashedPassword,
      });
    }

    if (input.revokeSessions) {
      await ctx.internalAdapter.deleteUserSessions(userId);
    }
  }
}

function assertPasswordLength(password: string): void {
  if (password.length < AUTH_MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > AUTH_MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be at most ${AUTH_MAX_PASSWORD_LENGTH} characters`);
  }
}
