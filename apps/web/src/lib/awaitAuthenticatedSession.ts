import { authClient } from './auth-client';

type SessionPayload = NonNullable<Parameters<typeof authClient.hydrateSession>[0]>;

/** Ensure better-auth client cache sees the session cookie before routing to Protected routes. */
export async function awaitAuthenticatedSession(): Promise<boolean> {
  const res = await fetch(`${window.location.origin}/api/auth/get-session`, {
    credentials: 'include',
  });
  if (!res.ok) {
    return false;
  }
  const payload = (await res.json()) as SessionPayload | null;
  if (!payload?.session) {
    return false;
  }
  authClient.hydrateSession(payload);
  return true;
}
