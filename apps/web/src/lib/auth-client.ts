import { createAuthClient } from 'better-auth/react';

/**
 * better-auth requires an absolute origin (throws on relative "/api").
 * Same-origin `/api/auth/*` is proxied by nginx to the API.
 */
function authBaseURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (configured && /^https?:\/\//.test(configured)) {
    return configured;
  }
  return 'http://localhost:3001';
}

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
});
