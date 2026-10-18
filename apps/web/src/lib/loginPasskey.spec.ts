// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth-client', () => ({
  authClient: {
    signIn: {
      passkey: vi.fn(),
    },
  },
}));

vi.mock('./awaitAuthenticatedSession', () => ({
  awaitAuthenticatedSession: vi.fn(),
}));

import { authClient } from './auth-client';
import { awaitAuthenticatedSession } from './awaitAuthenticatedSession';
import { signInWithPasskey } from './loginPasskey';

describe('signInWithPasskey', () => {
  beforeEach(() => {
    vi.mocked(authClient.signIn.passkey).mockReset();
    vi.mocked(awaitAuthenticatedSession).mockReset();
  });

  it('returns ok when passkey sign-in succeeds', async () => {
    vi.mocked(authClient.signIn.passkey).mockResolvedValue({ data: {}, error: null });
    vi.mocked(awaitAuthenticatedSession).mockResolvedValue(true);
    await expect(signInWithPasskey()).resolves.toEqual({ ok: true });
  });

  it('returns error when passkey sign-in fails', async () => {
    const error = { message: 'failed', status: 400, statusText: 'Bad Request' };
    vi.mocked(authClient.signIn.passkey).mockResolvedValue({ data: null, error });
    await expect(signInWithPasskey()).resolves.toEqual({ ok: false, error });
  });
});
