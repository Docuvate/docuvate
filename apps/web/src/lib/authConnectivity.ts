// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { AuthClientErrorLike } from './authErrors';

export type ConnectivityFailureKind = 'browser-offline' | 'server-unreachable' | 'server-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readAuthClientErrorShape(error: unknown): AuthClientErrorLike {
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
  return false;
}

export function classifyConnectivityFailure(error: unknown): ConnectivityFailureKind | null {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'browser-offline';
  }

  const parsed = readAuthClientErrorShape(error);
  if (isLikelyNetworkError(error, parsed.status)) {
    return 'server-unreachable';
  }
  if (typeof parsed.status === 'number' && parsed.status >= 500) {
    return 'server-error';
  }
  return null;
}
