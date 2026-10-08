import i18n from '../i18n';

export type UserFacingError = {
  i18nKey: string;
  params?: Record<string, string | number>;
  retryable: boolean;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

const CODE_TO_I18N_KEY: Record<string, string> = {
  NOT_FOUND: 'errors.notFound',
  FORBIDDEN: 'errors.forbidden',
  VALIDATION_ERROR: 'errors.validation',
  CONFLICT: 'errors.conflict',
  GATEWAY_TIMEOUT: 'errors.timeout',
  SERVICE_UNAVAILABLE: 'errors.serverError',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function looksLikeI18nKey(message: string): boolean {
  if (!message || message.includes(' ')) {
    return false;
  }
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(message);
}

function parseUnknownError(err: unknown): {
  status?: number;
  code?: string;
  message?: string;
} {
  if (err instanceof ApiRequestError) {
    return { status: err.status, code: err.code, message: err.message };
  }
  if (isRecord(err)) {
    const nested = isRecord(err.error) ? err.error : null;
    const status =
      (typeof err.status === 'number' ? err.status : undefined) ??
      (nested && typeof nested.status === 'number' ? nested.status : undefined);
    const code =
      (typeof err.code === 'string' ? err.code : undefined) ??
      (nested && typeof nested.code === 'string' ? nested.code : undefined);
    const message =
      (typeof err.message === 'string' ? err.message : undefined) ??
      (nested && typeof nested.message === 'string' ? nested.message : undefined);
    return { status, code, message };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return {};
}

function isLikelyNetworkError(err: unknown, status: number | undefined): boolean {
  if (status === 0) {
    return true;
  }
  if (err instanceof TypeError) {
    return true;
  }
  return false;
}

function isLikelyTimeout(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return true;
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return true;
  }
  return false;
}

function statusI18nKey(status: number): string | undefined {
  if (status === 409) {
    return 'errors.conflict';
  }
  if (status === 413) {
    return 'errors.payloadTooLarge';
  }
  if (status === 429) {
    return 'errors.tooManyRequests';
  }
  if (status === 408 || status === 504) {
    return 'errors.timeout';
  }
  if (status >= 500) {
    return 'errors.serverError';
  }
  return undefined;
}

function logRawApiError(err: unknown, fallbackKey: string): void {
  const parsed = parseUnknownError(err);
  console.warn('[api]', {
    fallbackKey,
    code: parsed.code,
    status: parsed.status,
    message: parsed.message ?? (err instanceof Error ? err.message : String(err)),
    error: err,
  });
}

export function toUserFacingError(err: unknown, fallbackKey = 'errors.generic'): UserFacingError {
  logRawApiError(err, fallbackKey);

  const parsed = parseUnknownError(err);
  const status = parsed.status;
  const code = parsed.code;
  const message = parsed.message ?? '';

  if (isLikelyNetworkError(err, status)) {
    return { i18nKey: 'errors.networkError', retryable: true };
  }
  if (isLikelyTimeout(err)) {
    return { i18nKey: 'errors.timeout', retryable: true };
  }

  if (message && looksLikeI18nKey(message)) {
    const retryable =
      status === 429 ||
      (typeof status === 'number' && status >= 500) ||
      code === 'GATEWAY_TIMEOUT' ||
      code === 'SERVICE_UNAVAILABLE';
    return { i18nKey: message, retryable };
  }

  if (code && CODE_TO_I18N_KEY[code]) {
    const mapped = CODE_TO_I18N_KEY[code];
    const retryable =
      code === 'GATEWAY_TIMEOUT' ||
      code === 'SERVICE_UNAVAILABLE' ||
      mapped === 'errors.serverError';
    return { i18nKey: mapped, retryable };
  }

  if (typeof status === 'number') {
    const byStatus = statusI18nKey(status);
    if (byStatus) {
      const retryable =
        byStatus === 'errors.tooManyRequests' ||
        byStatus === 'errors.serverError' ||
        byStatus === 'errors.timeout';
      return { i18nKey: byStatus, retryable };
    }
  }

  return { i18nKey: fallbackKey, retryable: false };
}

export function formatUserFacingError(err: unknown, fallbackKey: string): string {
  const facing = toUserFacingError(err, fallbackKey);
  return i18n.t(facing.i18nKey, facing.params ?? {});
}

export function throwApiRequestError(
  status: number,
  body: Record<string, unknown>,
): never {
  const code = typeof body.code === 'string' ? body.code : undefined;
  const message =
    typeof body.message === 'string' ? body.message : `Request failed (${status})`;
  throw new ApiRequestError(status, code, message);
}

const CHAT_GENERATION_ERROR_KEYS: Record<string, string> = {
  generation_timeout: 'documents.documentChat.errorTimeout',
  cancelled: 'documents.documentChat.errorCancelled',
  ollama_error: 'documents.documentChat.errorOllama',
  worker_unreachable: 'documents.documentChat.errorWorkerUnreachable',
  provider_unavailable: 'documents.documentChat.errorProviderUnavailable',
  unknown: 'documents.documentChat.errorGeneric',
};

export function toUserFacingChatGenerationError(
  errorCode: string | null | undefined,
): UserFacingError {
  const normalized = errorCode?.trim() || 'unknown';
  const i18nKey =
    CHAT_GENERATION_ERROR_KEYS[normalized] ?? CHAT_GENERATION_ERROR_KEYS.unknown;
  console.warn('[api]', 'chatGeneration', { errorCode: normalized, i18nKey });
  return {
    i18nKey,
    retryable: normalized !== 'cancelled',
  };
}

export function formatChatGenerationError(errorCode: string | null | undefined): string {
  const facing = toUserFacingChatGenerationError(errorCode);
  return i18n.t(facing.i18nKey, facing.params ?? {});
}
