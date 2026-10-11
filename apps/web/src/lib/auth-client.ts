// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { routes } from './routes';

/**
 * better-auth requires an absolute origin (throws on relative "/api").
 * Same-origin `/api/auth/*` is proxied by nginx to the API.
 */
function authBaseURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const configured = import.meta.env.VITE_API_URL;
  if (configured && /^https?:\/\//.test(configured)) {
    return configured;
  }
  return 'http://localhost:3001';
}

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== 'undefined') {
          window.location.assign(
            `${routes.loginTwoFactor}?return=${encodeURIComponent(window.location.pathname)}`
          );
        }
      },
    }),
    passkeyClient(),
  ],
});

type AuthSessionPayload = {
  user?: { id: string; email?: string | null; twoFactorEnabled?: boolean | null } | null;
} | null | undefined;

/** Session can exist before `user` is populated; `session?.user.id` throws when `user` is missing. */
export function authSessionUserId(session: AuthSessionPayload): string | undefined {
  const user = session?.user;
  if (user == null) {
    return undefined;
  }
  return user.id;
}

export function authSessionUserEmail(session: AuthSessionPayload): string | undefined {
  const user = session?.user;
  if (user == null) {
    return undefined;
  }
  return user.email ?? undefined;
}

export function authSessionUserTwoFactorEnabled(session: AuthSessionPayload): boolean {
  const user = session?.user;
  if (user == null) {
    return false;
  }
  return user.twoFactorEnabled === true;
}
