import {
  DomainError,
  GatewayTimeoutError,
  ServiceUnavailableError,
} from '../../domain/errors.js';

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
  return new ServiceUnavailableError(`Extraktions-Vergleich fehlgeschlagen (${status}).`);
}

export async function fetchWorkerJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    ) {
      throw workerCompareTimeoutError();
    }
    throw error;
  }

  if (!response.ok) {
    throw mapWorkerCompareHttpStatus(response.status);
  }

  return (await response.json()) as T;
}
