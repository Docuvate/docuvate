// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const DEFAULT_TIMEOUT_MS = 15_000;

export async function connectorFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...rest, signal });
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function joinUrl(base: string, path: string): string {
  const normalizedBase = trimTrailingSlash(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
