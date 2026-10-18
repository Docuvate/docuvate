// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord } from './apiErrors';
import { authClient } from './auth-client';

type SessionPayload = NonNullable<Parameters<typeof authClient.hydrateSession>[0]>;

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!isRecord(value)) {
    return false;
  }
  return isRecord(value.session);
}

/** Ensure better-auth client cache sees the session cookie before routing to Protected routes. */
export async function awaitAuthenticatedSession(): Promise<boolean> {
  const res = await fetch(`${window.location.origin}/api/auth/get-session`, {
    credentials: 'include',
  });
  if (!res.ok) {
    return false;
  }
  const payload: unknown = await res.json();
  if (!isSessionPayload(payload)) {
    return false;
  }
  authClient.hydrateSession(payload);
  return true;
}
