// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { authClient } from './auth-client';
import { awaitAuthenticatedSession } from './awaitAuthenticatedSession';

export async function signInWithPasskey(): Promise<{ ok: true } | { ok: false; error: unknown }> {
  try {
    const result = await authClient.signIn.passkey();
    if (result.error) {
      return { ok: false, error: result.error };
    }
    if (!(await awaitAuthenticatedSession())) {
      return { ok: false, error: new Error('AUTH_SESSION_NOT_VISIBLE') };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
