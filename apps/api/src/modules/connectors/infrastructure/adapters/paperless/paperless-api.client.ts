import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import { connectorFetch, joinUrl, trimTrailingSlash } from '../shared/connector-http.js';

export interface PaperlessAuthHeaders {
  Authorization: string;
}

export function resolvePaperlessBaseUrl(credentials: ConnectorConfigurationInput): string {
  return trimTrailingSlash(credentials['base_url']?.trim() ?? '');
}

export function paperlessAuthHeaders(credentials: ConnectorConfigurationInput): PaperlessAuthHeaders {
  const token = credentials['api_token']?.trim();
  if (token) {
    return { Authorization: `Token ${token}` };
  }
  const username = credentials['username']?.trim() ?? '';
  const password = credentials['password']?.trim() ?? '';
  const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

export function paperlessApiFetch(
  credentials: ConnectorConfigurationInput,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const baseUrl = resolvePaperlessBaseUrl(credentials);
  const headers = new Headers(init.headers);
  const auth = paperlessAuthHeaders(credentials);
  headers.set('Authorization', auth.Authorization);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return connectorFetch(joinUrl(baseUrl, path), { ...init, headers });
}

export async function validatePaperlessConnection(
  credentials: ConnectorConfigurationInput
): Promise<void> {
  const response = await paperlessApiFetch(credentials, '/api/documents/?page=1&page_size=1');
  if (response.status === 401 || response.status === 403) {
    throw new Error('PAPERLESS_UNAUTHORIZED');
  }
  if (!response.ok) {
    throw new Error('PAPERLESS_UNREACHABLE');
  }
}
