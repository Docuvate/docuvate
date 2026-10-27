// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DomainError, GatewayTimeoutError, ServiceUnavailableError } from '../../domain/errors.js';

const DEFAULT_COMPARE_TIMEOUT_MS = 600_000;
/** Matches worker `DOCUVATE_EXTRACT_TIMEOUT_SECONDS` (900s) so a hung `/extract` cannot run forever. */
const DEFAULT_EXTRACT_TIMEOUT_MS = 900_000;

function parsePositiveTimeoutMs(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function workerCompareTimeoutMs(): number {
  return parsePositiveTimeoutMs(process.env['WORKER_COMPARE_TIMEOUT_MS'], DEFAULT_COMPARE_TIMEOUT_MS);
}

/** HTTP deadline for API → worker `/extract`. A hung worker must not keep the document non-terminal. */
export function workerExtractTimeoutMs(): number {
  const fromMs = parsePositiveTimeoutMs(process.env['WORKER_EXTRACT_TIMEOUT_MS'], 0);
  if (fromMs > 0) {
    return fromMs;
  }
  const fromSeconds = parsePositiveTimeoutMs(process.env['DOCUVATE_EXTRACT_TIMEOUT_SECONDS'], 0);
  if (fromSeconds > 0) {
    return fromSeconds * 1000;
  }
  return DEFAULT_EXTRACT_TIMEOUT_MS;
}

export function workerExtractTimeoutSeconds(): number {
  return Math.max(1, Math.ceil(workerExtractTimeoutMs() / 1000));
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
