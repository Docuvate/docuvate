import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
import { routes } from './routes';

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
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== 'undefined') {
          window.location.assign(`${routes.loginTwoFactor}?return=${encodeURIComponent(window.location.pathname)}`);
        }
      },
    }),
    passkeyClient(),
  ],
});
