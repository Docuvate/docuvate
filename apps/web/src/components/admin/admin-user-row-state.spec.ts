// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminUserDto } from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  getUserRowState,
  invitePasswordsMatch,
  isTwoFactorSubmitEnabled,
  validateInviteForm,
} from './admin-user-row-state';

const t = vi.fn((key: string) => key);

const baseUser: AdminUserDto = {
  id: 'user-1',
  name: 'User One',
  email: 'one@example.com',
  role: 'admin',
  banned: false,
  banReason: null,
  accountStatus: 'active',
  createdAt: new Date().toISOString(),
};

describe('admin user row state', () => {
  it('disables role select for the signed-in user', () => {
    const state = getUserRowState(baseUser, false, 'user-1', null, t);
    expect(state.self).toBe(true);
    expect(state.roleDisabled).toBe(true);
  });

  it('shows last-admin hint when sole administrator', () => {
    const state = getUserRowState(baseUser, false, 'other', 'user-1', t);
    expect(state.soleAdmin).toBe(true);
    expect(state.readonlyHint).toBe('admin.errors.lastAdministrator');
  });

  it('validates invite email', () => {
    expect(validateInviteForm('bad')).toBe(false);
    expect(validateInviteForm('ok@example.com')).toBe(true);
  });

  it('detects invite password mismatch', () => {
    expect(invitePasswordsMatch('a', 'b')).toBe(false);
    expect(invitePasswordsMatch('same', 'same')).toBe(true);
  });

  it('requires a 2FA code before submit', () => {
    expect(isTwoFactorSubmitEnabled('', false)).toBe(false);
    expect(isTwoFactorSubmitEnabled('123456', false)).toBe(true);
    expect(isTwoFactorSubmitEnabled('123456', true)).toBe(false);
  });
});
