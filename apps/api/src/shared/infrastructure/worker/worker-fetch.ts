// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DomainError, GatewayTimeoutError, ServiceUnavailableError } from '../../domain/errors.js';

const DEFAULT_COMPARE_TIMEOUT_MS = 600_000;

export function workerCompareTimeoutMs(): number {
  const raw = process.env['WORKER_COMPARE_TIMEOUT_MS'];
  if (!raw) {
    return DEFAULT_COMPARE_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_COMPARE_TIMEOUT_MS;
  }
  return parsed;
}

export function workerCompareTimeoutError(): GatewayTimeoutError {
  return new GatewayTimeoutError(
    'Extraktions-Vergleich hat das Zeitlimit überschritten (OCR lädt Modelle?). Bitte erneut versuchen.'
  );
}

export function mapWorkerCompareHttpStatus(status: number): DomainError {
  if (status === 504 || status === 408) {
    return workerCompareTimeoutError();
  }
  if (status === 502 || status === 503) {
    return new ServiceUnavailableError(
      'Extraktions-Worker vorübergehend nicht erreichbar. Bitte später erneut versuchen.'
    );
  }
  return new ServiceUnavailableError(`Extraktions-Vergleich fehlgeschlagen (${String(status)}).`);
}

export interface WorkerFetchErrorMapping {
  onTimeout?: () => GatewayTimeoutError;
  onHttpError?: (status: number, responseBody?: unknown) => DomainError;
}

export function workerLayoutTimeoutError(): GatewayTimeoutError {
  return new GatewayTimeoutError(
    'Layout-Rendering hat das Zeitlimit überschritten. Bitte erneut versuchen.'
  );
}

export function mapWorkerLayoutHttpStatus(status: number): DomainError {
  if (status === 504 || status === 408) {
    return workerLayoutTimeoutError();
  }
  if (status === 502 || status === 503) {
    return new ServiceUnavailableError(
      'Layout-Worker vorübergehend nicht erreichbar. Bitte später erneut versuchen.'
    );
  }
  return new ServiceUnavailableError('documents.layoutCompareErrors.compareFailed');
}

export async function fetchWorkerJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  errors: WorkerFetchErrorMapping = {}
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw errors.onTimeout?.() ?? workerCompareTimeoutError();
    }
    throw error;
  }

  if (!response.ok) {
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }
    throw errors.onHttpError?.(response.status, responseBody) ?? mapWorkerCompareHttpStatus(response.status);
  }

  return await response.json();
}
