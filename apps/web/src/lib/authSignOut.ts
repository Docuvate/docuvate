// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { authClient } from './auth-client';
import { clearAuthenticatedSessionHint } from './authSessionHint';
import { formatAuthClientError } from './authErrors';
import { routes } from './routes';

export async function performSignOut(): Promise<void> {
  clearAuthenticatedSessionHint();
  try {
    const result = await authClient.signOut();
    if (result.error) {
      formatAuthClientError(result.error, 'signOut');
      window.location.href = `${routes.login}?reason=sign_out_failed`;
      return;
    }
  } catch (err) {
    formatAuthClientError(err, 'signOut');
    window.location.href = `${routes.login}?reason=sign_out_failed`;
    return;
  }
  window.location.href = routes.login;
}
