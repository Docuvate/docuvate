// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import { joinUrl, trimTrailingSlash } from '../shared/connector-http.js';
import type {
  PaperlessCorrespondent,
  PaperlessCustomField,
  PaperlessDocument,
  PaperlessDocumentType,
  PaperlessPaginated,
  PaperlessStoragePath,
  PaperlessTag,
} from './paperless-api.types.js';
import {
  MAX_DOWNLOAD_BYTES,
  MAX_LIST_ITEMS,
  MAX_LIST_PAGES,
  PaperlessUrlValidationError,
  paperlessSafeFetch,
  readResponseWithSizeCap,
  validatePaperlessBaseUrl,
} from './paperless-url-security.js';

export interface PaperlessAuthHeaders {
  Authorization: string;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function resolvePaperlessBaseUrl(credentials: ConnectorConfigurationInput): string {
  return trimTrailingSlash(credentials['base_url']?.trim() ?? '');
}

export async function resolveValidatedPaperlessBaseUrl(
  credentials: ConnectorConfigurationInput
): Promise<string> {
  return validatePaperlessBaseUrl(resolvePaperlessBaseUrl(credentials));
}

export function paperlessAuthHeaders(
  credentials: ConnectorConfigurationInput
): PaperlessAuthHeaders {
  const token = credentials['api_token']?.trim();
  if (token) {
    return { Authorization: `Token ${token}` };
  }
  const username = credentials['username']?.trim() ?? '';
  const password = credentials['password']?.trim() ?? '';
  const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

function acceptHeader(apiVersion: number): string {
  if (apiVersion === 0) {
    return 'application/json';
  }
  return `application/json; version=${apiVersion}`;
}

export async function obtainPaperlessApiToken(
  credentials: ConnectorConfigurationInput
): Promise<string> {
  const baseUrl = await resolveValidatedPaperlessBaseUrl(credentials);
  const username = credentials['username']?.trim() ?? '';
  const password = credentials['password']?.trim() ?? '';
  const response = await paperlessSafeFetch(baseUrl, '/api/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error('PAPERLESS_UNAUTHORIZED');
  }
  if (!response.ok) {
    throw new Error('PAPERLESS_UNREACHABLE');
  }
  const body = (await response.json()) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    throw new Error('PAPERLESS_UNREACHABLE');
  }
  return token;
}

export async function resolvePaperlessCredentials(
  credentials: ConnectorConfigurationInput
): Promise<ConnectorConfigurationInput> {
  const baseUrl = await resolveValidatedPaperlessBaseUrl(credentials);
  const withBase = { ...credentials, base_url: baseUrl };
  if (credentials['api_token']?.trim()) {
    return withBase;
  }
  const token = await obtainPaperlessApiToken(withBase);
  return { ...withBase, api_token: token };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function paperlessApiFetch(
  credentials: ConnectorConfigurationInput,
  path: string,
  init: RequestInit = {},
  apiVersion = 3
): Promise<Response> {
  const baseUrl = resolvePaperlessBaseUrl(credentials);
  const headers = new Headers(init.headers);
  const auth = paperlessAuthHeaders(credentials);
  headers.set('Authorization', auth.Authorization);
  headers.set('Accept', acceptHeader(apiVersion));
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let attempt = 0;
  while (true) {
    const response = await paperlessSafeFetch(baseUrl, path, {
      ...init,
      headers,
    });
    if (!RETRYABLE_STATUS.has(response.status) || attempt >= 4) {
      return response;
    }
    attempt += 1;
    await sleep(Math.min(8000, 400 * 2 ** attempt));
  }
}

export async function detectPaperlessApiVersion(
  credentials: ConnectorConfigurationInput
): Promise<number> {
  for (const version of [3, 2, 0]) {
    const response = await paperlessApiFetch(
      credentials,
      '/api/documents/?page=1&page_size=1',
      {},
      version
    );
    if (response.ok) {
      return version === 0 ? 3 : version;
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('PAPERLESS_UNAUTHORIZED');
    }
    if (response.status === 404) {
      throw new Error('PAPERLESS_NOT_FOUND');
    }
  }
  throw new Error('PAPERLESS_VERSION_UNSUPPORTED');
}

export async function validatePaperlessConnection(
  credentials: ConnectorConfigurationInput
): Promise<{ apiVersion: number }> {
  const resolved = await resolvePaperlessCredentials(credentials);
  const apiVersion = await detectPaperlessApiVersion(resolved);
  return { apiVersion };
}

export class PaperlessApiClient {
  private readonly acceptVersion: number;
  private readonly baseUrl: string;

  constructor(
    private readonly credentials: ConnectorConfigurationInput,
    apiVersion: number
  ) {
    this.acceptVersion = apiVersion === 3 ? 0 : apiVersion;
    this.baseUrl = resolvePaperlessBaseUrl(credentials);
  }

  async listDocuments(params: {
    page: number;
    pageSize: number;
    modifiedGt?: string | null;
  }): Promise<PaperlessPaginated<PaperlessDocument>> {
    const search = new URLSearchParams();
    search.set('page', String(params.page));
    search.set('page_size', String(params.pageSize));
    search.set('ordering', 'modified,id');
    if (params.modifiedGt) {
      search.set('modified__gt', params.modifiedGt);
    }
    const response = await paperlessApiFetch(
      this.credentials,
      `/api/documents/?${search.toString()}`,
      {},
      this.acceptVersion
    );
    if (!response.ok) {
      throw new Error('PAPERLESS_LIST_FAILED');
    }
    return (await response.json()) as PaperlessPaginated<PaperlessDocument>;
  }

  async getDocument(id: number): Promise<PaperlessDocument> {
    const response = await paperlessApiFetch(
      this.credentials,
      `/api/documents/${id}/`,
      {},
      this.acceptVersion
    );
    if (response.status === 404) {
      throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
    }
    if (!response.ok) {
      throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
    }
    return (await response.json()) as PaperlessDocument;
  }

  async downloadDocument(id: number, original = true): Promise<Buffer> {
    const path = original
      ? `/api/documents/${id}/download/?original=true`
      : `/api/documents/${id}/download/`;
    const auth = paperlessAuthHeaders(this.credentials);
    const response = await paperlessSafeFetch(this.baseUrl, joinUrl(this.baseUrl, path), {
      headers: { Authorization: auth.Authorization, Accept: '*/*' },
    });
    if (!response.ok) {
      throw new Error('PAPERLESS_DOWNLOAD_FAILED');
    }
    try {
      return await readResponseWithSizeCap(response, MAX_DOWNLOAD_BYTES);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'PAPERLESS_DOWNLOAD_TOO_LARGE') {
        throw new Error('PAPERLESS_DOWNLOAD_TOO_LARGE');
      }
      throw err;
    }
  }

  async listAllPages<T>(path: string, pageSize = 100): Promise<{ items: T[]; total: number }> {
    const items: T[] = [];
    let page = 1;
    let total = 0;
    while (page <= MAX_LIST_PAGES && items.length < MAX_LIST_ITEMS) {
      const response = await paperlessApiFetch(
        this.credentials,
        `${path}${path.includes('?') ? '&' : '?'}page=${page}&page_size=${pageSize}`,
        {},
        this.acceptVersion
      );
      if (!response.ok) {
        throw new Error('PAPERLESS_LIST_FAILED');
      }
      const body = (await response.json()) as PaperlessPaginated<T>;
      total = body.count;
      items.push(...body.results);
      if (!body.next || body.results.length === 0) {
        break;
      }
      page += 1;
      await sleep(120);
    }
    if (page > MAX_LIST_PAGES || items.length >= MAX_LIST_ITEMS) {
      throw new Error('PAPERLESS_LIST_LIMIT');
    }
    return { items, total };
  }

  listTags(): Promise<{ items: PaperlessTag[]; total: number }> {
    return this.listAllPages<PaperlessTag>('/api/tags/');
  }

  listCorrespondents(): Promise<{ items: PaperlessCorrespondent[]; total: number }> {
    return this.listAllPages<PaperlessCorrespondent>('/api/correspondents/');
  }

  listDocumentTypes(): Promise<{ items: PaperlessDocumentType[]; total: number }> {
    return this.listAllPages<PaperlessDocumentType>('/api/document_types/');
  }

  listStoragePaths(): Promise<{ items: PaperlessStoragePath[]; total: number }> {
    return this.listAllPages<PaperlessStoragePath>('/api/storage_paths/');
  }

  listCustomFields(): Promise<{ items: PaperlessCustomField[]; total: number }> {
    return this.listAllPages<PaperlessCustomField>('/api/custom_fields/');
  }
}

export { PaperlessUrlValidationError };
