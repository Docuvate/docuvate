// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function resolveApiBaseUrl(): string {
  const configured =
    import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:3001');
  const normalized = configured.replace(/\/$/, '');
  if (normalized.endsWith('/v1')) {
    return normalized;
  }
  return `${normalized}/v1`;
}

const baseURL = resolveApiBaseUrl();

export function apiBaseUrl(): string {
  return baseURL;
}
