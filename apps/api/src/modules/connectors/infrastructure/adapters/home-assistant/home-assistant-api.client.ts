// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import { connectorFetch, joinUrl, trimTrailingSlash } from '../shared/connector-http.js';

export function resolveHomeAssistantBaseUrl(credentials: ConnectorConfigurationInput): string {
  return trimTrailingSlash(credentials['base_url']?.trim() ?? '');
}

export function homeAssistantToken(credentials: ConnectorConfigurationInput): string {
  return credentials['access_token']?.trim() ?? '';
}

export function homeAssistantApiFetch(
  credentials: ConnectorConfigurationInput,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const baseUrl = resolveHomeAssistantBaseUrl(credentials);
  const token = homeAssistantToken(credentials);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return connectorFetch(joinUrl(baseUrl, path), { ...init, headers });
}

export async function validateHomeAssistantConnection(
  credentials: ConnectorConfigurationInput
): Promise<void> {
  const response = await homeAssistantApiFetch(credentials, '/api/');
  if (response.status === 401 || response.status === 403) {
    throw new Error('HA_UNAUTHORIZED');
  }
  if (!response.ok) {
    throw new Error('HA_UNREACHABLE');
  }
}
