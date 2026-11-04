// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { apiBaseUrl } from './apiBaseUrl';

interface ApiHealthFailure {
  ok: false;
  status?: number;
  errorType: string;
}

type ApiHealthProbeResult = { ok: true } | ApiHealthFailure;

function apiHealthCheckUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/api/health`;
  }
  return apiBaseUrl().replace(/\/v1$/, '/health');
}

export async function probeApiHealth(signal?: AbortSignal): Promise<ApiHealthProbeResult> {
  try {
    const response = await fetch(apiHealthCheckUrl(), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal,
    });
    if (response.ok) {
      return { ok: true };
    }
    if (response.status >= 500) {
      return { ok: false, status: response.status, errorType: 'http_5xx' };
    }
    return { ok: false, status: response.status, errorType: 'http_error' };
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, errorType: 'aborted' };
    }
    if (error instanceof TypeError) {
      return { ok: false, errorType: 'network' };
    }
    if (error instanceof Error) {
      return { ok: false, errorType: error.name };
    }
    return { ok: false, errorType: 'unknown' };
  }
}
