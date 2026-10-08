import i18n from '../i18n';

export type AuthErrorContext =
  | 'signIn'
  | 'signUp'
  | 'signOut'
  | 'session'
  | 'forgotPassword'
  | 'resetPassword';

export type AuthClientErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
  statusText?: string | null;
};

const AUTH_ERROR_CODE_KEYS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'auth.errors.invalidEmailOrPassword',
  INVALID_USERNAME_OR_PASSWORD: 'auth.errors.invalidEmailOrPassword',
  INVALID_PASSWORD: 'auth.errors.invalidEmailOrPassword',
  INVALID_EMAIL: 'auth.errors.invalidEmail',
  INVALID_EMAIL_FORMAT: 'auth.errors.invalidEmail',
  EMAIL_NOT_VERIFIED: 'auth.errors.emailNotVerified',
  USER_ALREADY_EXISTS: 'auth.errors.userAlreadyExists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'auth.errors.userAlreadyExists',
  PASSWORD_TOO_SHORT: 'auth.errors.passwordTooShort',
  PASSWORD_TOO_LONG: 'auth.errors.passwordTooLong',
  SESSION_EXPIRED: 'auth.errors.sessionExpired',
  SESSION_NOT_FRESH: 'auth.errors.sessionExpired',
  FAILED_TO_GET_SESSION: 'auth.errors.sessionExpired',
  INVALID_SESSION_TOKEN: 'auth.errors.sessionExpired',
  INVALID_TOKEN: 'auth.errors.sessionExpired',
  TOKEN_EXPIRED: 'auth.errors.sessionExpired',
  TOO_MANY_REQUESTS: 'auth.errors.tooManyRequests',
  TOO_MANY_ATTEMPTS: 'auth.errors.tooManyRequests',
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: 'auth.errors.tooManyRequests',
};

const CONTEXT_FALLBACK_KEYS: Record<AuthErrorContext, string> = {
  signIn: 'auth.errors.signInFailed',
  signUp: 'auth.errors.registerFailed',
  signOut: 'auth.errors.signOutFailed',
  session: 'auth.errors.sessionExpired',
  forgotPassword: 'auth.forgotPasswordFailed',
  resetPassword: 'auth.resetPasswordFailed',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readAuthClientErrorLike(error: unknown): AuthClientErrorLike {
  if (!isRecord(error)) {
    return {};
  }

  const nested = isRecord(error.error) ? error.error : null;

  const code =
    (typeof error.code === 'string' ? error.code : undefined) ??
    (nested && typeof nested.code === 'string' ? nested.code : undefined);

  const message =
    (typeof error.message === 'string' ? error.message : undefined) ??
    (nested && typeof nested.message === 'string' ? nested.message : undefined);

  const status =
    (typeof error.status === 'number' ? error.status : undefined) ??
    (nested && typeof nested.status === 'number' ? nested.status : undefined);

  const statusText =
    (typeof error.statusText === 'string' ? error.statusText : undefined) ??
    (nested && typeof nested.statusText === 'string' ? nested.statusText : undefined);

  return { code, message, status, statusText };
}

function isLikelyNetworkError(error: unknown, status: number | null | undefined): boolean {
  if (status === 0) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return false;
}

function isExpectedSignInFailure(
  parsed: AuthClientErrorLike,
  context: AuthErrorContext
): boolean {
  if (context !== 'signIn') {
    return false;
  }
  if (parsed.status === 401) {
    return true;
  }
  const code = parsed.code ?? '';
  return (
    code === 'INVALID_EMAIL_OR_PASSWORD' ||
    code === 'INVALID_USERNAME_OR_PASSWORD' ||
    code === 'INVALID_PASSWORD'
  );
}

function logRawAuthError(error: unknown, context: AuthErrorContext): void {
  const parsed = readAuthClientErrorLike(error);
  if (isExpectedSignInFailure(parsed, context)) {
    return;
  }
  const rawMessage =
    parsed.message ??
    (error instanceof Error ? error.message : undefined) ??
    String(error);
  console.warn('[auth]', context, {
    code: parsed.code,
    status: parsed.status,
    message: rawMessage,
    error,
  });
}

export function authErrorI18nKeyForCode(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  return AUTH_ERROR_CODE_KEYS[code];
}

export function formatAuthClientError(error: unknown, context: AuthErrorContext): string {
  logRawAuthError(error, context);

  const parsed = readAuthClientErrorLike(error);
  const status = parsed.status;

  if (isLikelyNetworkError(error, status)) {
    return i18n.t('auth.errors.networkError');
  }
  if (status === 429) {
    return i18n.t('auth.errors.tooManyRequests');
  }
  if (typeof status === 'number' && status >= 500) {
    return i18n.t('auth.errors.serverError');
  }

  const mappedKey = authErrorI18nKeyForCode(parsed.code ?? undefined);
  if (mappedKey) {
    return i18n.t(mappedKey);
  }

  return i18n.t(CONTEXT_FALLBACK_KEYS[context] ?? 'auth.errors.generic');
}
