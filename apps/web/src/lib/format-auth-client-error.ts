import {
  formatAuthClientError as mapAuthClientError,
  type AuthErrorContext,
} from './authErrors';

type AuthErrorShape = {
  message?: string;
  code?: string;
  status?: number;
} | null | undefined;

/**
 * Password-reset pages (PR #73): optional per-code overrides, otherwise
 * {@link mapAuthClientError} (no raw better-auth messages in UI).
 */
export function formatAuthClientError(
  error: AuthErrorShape,
  fallback: string,
  byCode?: Record<string, string>,
  context: AuthErrorContext = 'signIn',
): string {
  if (!error) {
    return fallback;
  }
  if (error.code && byCode?.[error.code]) {
    return byCode[error.code];
  }
  return mapAuthClientError(error, context);
}
