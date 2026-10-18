// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  parseNumber,
  parseOptionalEnum,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
} from '../../../../../shared/infrastructure/database/row-parse.js';
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
  paperlessSafeFetch,
  PaperlessUrlValidationError,
  readResponseWithSizeCap,
  validatePaperlessBaseUrl,
} from './paperless-url-security.js';

export interface PaperlessAuthHeaders {
  Authorization: string;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const PAPERLESS_CUSTOM_FIELD_DATA_TYPES = [
  'string',
  'url',
  'date',
  'boolean',
  'integer',
  'float',
  'monetary',
  'documentlink',
  'select',
] as const;

function readCredentialString(credentials: ConnectorConfigurationInput, key: string): string {
  const value = credentials[key];
  return typeof value === 'string' ? value : '';
}

function parsePaperlessPaginated<T>(
  value: unknown,
  parseItem: (item: unknown) => T | null
): PaperlessPaginated<T> {
  const row = recordFromUnknown(value);
  if (!row) {
    throw new Error('PAPERLESS_LIST_FAILED');
  }
  const results: T[] = [];
  if (Array.isArray(row.results)) {
    for (const item of row.results) {
      const parsed = parseItem(item);
      if (parsed !== null) {
        results.push(parsed);
      }
    }
  }
  return {
    count: parseNumber(row.count),
    next: parseOptionalString(row.next),
    previous: parseOptionalString(row.previous),
    results,
  };
}

function parsePaperlessDocumentNotes(value: unknown): PaperlessDocument['notes'] {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  const notes: { note: string }[] = [];
  for (const item of value) {
    const entry = recordFromUnknown(item);
    if (!entry) {
      continue;
    }
    notes.push({ note: parseString(entry.note) });
  }
  return notes;
}

function parsePaperlessDocument(value: unknown): PaperlessDocument | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  let customFields: PaperlessDocument['custom_fields'];
  if (Array.isArray(row.custom_fields)) {
    const entries: { field: number; value: unknown }[] = [];
    for (const item of row.custom_fields) {
      const entry = recordFromUnknown(item);
      if (!entry) {
        continue;
      }
      entries.push({ field: parseNumber(entry.field), value: entry.value });
    }
    customFields = entries;
  } else {
    const record = recordFromUnknown(row.custom_fields);
    customFields = record ?? {};
  }
  return {
    id,
    title: parseString(row.title),
    content: parseOptionalString(row.content),
    created: parseString(row.created),
    modified: parseString(row.modified),
    added: parseString(row.added),
    archive_serial_number: parseOptionalNumber(row.archive_serial_number),
    original_file_name: parseOptionalString(row.original_file_name),
    mime_type: parseOptionalString(row.mime_type),
    checksum: parseOptionalString(row.checksum),
    correspondent: parseOptionalNumber(row.correspondent),
    document_type: parseOptionalNumber(row.document_type),
    storage_path: parseOptionalNumber(row.storage_path),
    tags: Array.isArray(row.tags)
      ? row.tags.map((tag) => parseNumber(tag)).filter((tag) => Number.isFinite(tag))
      : [],
    custom_fields: customFields,
    notes: parsePaperlessDocumentNotes(row.notes),
    owner: parseOptionalNumber(row.owner),
  };
}

function parsePaperlessTag(value: unknown): PaperlessTag | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  return {
    id,
    name: parseString(row.name),
    color: parseString(row.color),
    matching_algorithm: parseNumber(row.matching_algorithm),
    match: parseString(row.match),
  };
}

function parsePaperlessCorrespondent(value: unknown): PaperlessCorrespondent | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  return {
    id,
    name: parseString(row.name),
    matching_algorithm: parseNumber(row.matching_algorithm),
    match: parseString(row.match),
  };
}

function parsePaperlessDocumentType(value: unknown): PaperlessDocumentType | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  return {
    id,
    name: parseString(row.name),
    matching_algorithm: parseNumber(row.matching_algorithm),
    match: parseString(row.match),
  };
}

function parsePaperlessStoragePath(value: unknown): PaperlessStoragePath | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  return {
    id,
    name: parseString(row.name),
    path: parseString(row.path),
    match: parseString(row.match),
    matching_algorithm: parseNumber(row.matching_algorithm),
  };
}

function parsePaperlessCustomField(value: unknown): PaperlessCustomField | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const id = parseOptionalNumber(row.id);
  if (id === null) {
    return null;
  }
  const dataType = parseOptionalEnum(row.data_type, PAPERLESS_CUSTOM_FIELD_DATA_TYPES);
  if (!dataType) {
    return null;
  }
  return {
    id,
    name: parseString(row.name),
    data_type: dataType,
    extra_data: recordFromUnknown(row.extra_data),
  };
}

export function resolvePaperlessBaseUrl(credentials: ConnectorConfigurationInput): string {
  return trimTrailingSlash(readCredentialString(credentials, 'base_url').trim());
}

export async function resolveValidatedPaperlessBaseUrl(
  credentials: ConnectorConfigurationInput
): Promise<string> {
  return validatePaperlessBaseUrl(resolvePaperlessBaseUrl(credentials));
}

export function paperlessAuthHeaders(
  credentials: ConnectorConfigurationInput
): PaperlessAuthHeaders {
  const token = readCredentialString(credentials, 'api_token').trim();
  if (token) {
    return { Authorization: `Token ${token}` };
  }
  const username = readCredentialString(credentials, 'username').trim();
  const password = readCredentialString(credentials, 'password').trim();
  const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

function acceptHeader(apiVersion: number): string {
  if (apiVersion === 0) {
    return 'application/json';
  }
  return `application/json; version=${String(apiVersion)}`;
}

export async function obtainPaperlessApiToken(
  credentials: ConnectorConfigurationInput
): Promise<string> {
  const baseUrl = await resolveValidatedPaperlessBaseUrl(credentials);
  const username = readCredentialString(credentials, 'username').trim();
  const password = readCredentialString(credentials, 'password').trim();
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
  const body = recordFromUnknown(await response.json());
  const token = body ? parseOptionalString(body.token)?.trim() : undefined;
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
  if (readCredentialString(credentials, 'api_token').trim()) {
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
  if (init.body !== undefined && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let attempt = 0;
  for (;;) {
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
    return parsePaperlessPaginated(await response.json(), parsePaperlessDocument);
  }

  async getDocument(id: number): Promise<PaperlessDocument> {
    const response = await paperlessApiFetch(
      this.credentials,
      `/api/documents/${String(id)}/`,
      {},
      this.acceptVersion
    );
    if (response.status === 404) {
      throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
    }
    if (!response.ok) {
      throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
    }
    const doc = parsePaperlessDocument(await response.json());
    if (!doc) {
      throw new Error('PAPERLESS_DOCUMENT_NOT_FOUND');
    }
    return doc;
  }

  async downloadDocument(id: number, original = true): Promise<Buffer> {
    const path = original
      ? `/api/documents/${String(id)}/download/?original=true`
      : `/api/documents/${String(id)}/download/`;
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

  private async listAllPages(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => PaperlessTag | null
  ): Promise<{ items: PaperlessTag[]; total: number }>;
  private async listAllPages(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => PaperlessStoragePath | null
  ): Promise<{ items: PaperlessStoragePath[]; total: number }>;
  private async listAllPages(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => PaperlessCorrespondent | null
  ): Promise<{ items: PaperlessCorrespondent[]; total: number }>;
  private async listAllPages(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => PaperlessDocumentType | null
  ): Promise<{ items: PaperlessDocumentType[]; total: number }>;
  private async listAllPages(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => PaperlessCustomField | null
  ): Promise<{ items: PaperlessCustomField[]; total: number }>;
  private async listAllPages<T>(
    path: string,
    pageSize: number,
    parseItem: (item: unknown) => T | null
  ): Promise<{ items: T[]; total: number }> {
    const items: T[] = [];
    let page = 1;
    let total = 0;
    while (page <= MAX_LIST_PAGES && items.length < MAX_LIST_ITEMS) {
      const separator = path.includes('?') ? '&' : '?';
      const response = await paperlessApiFetch(
        this.credentials,
        `${path}${separator}page=${String(page)}&page_size=${String(pageSize)}`,
        {},
        this.acceptVersion
      );
      if (!response.ok) {
        throw new Error('PAPERLESS_LIST_FAILED');
      }
      const body = parsePaperlessPaginated(await response.json(), parseItem);
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
    return this.listAllPages('/api/tags/', 100, parsePaperlessTag);
  }

  listCorrespondents(): Promise<{ items: PaperlessCorrespondent[]; total: number }> {
    return this.listAllPages('/api/correspondents/', 100, parsePaperlessCorrespondent);
  }

  listDocumentTypes(): Promise<{ items: PaperlessDocumentType[]; total: number }> {
    return this.listAllPages('/api/document_types/', 100, parsePaperlessDocumentType);
  }

  listStoragePaths(): Promise<{ items: PaperlessStoragePath[]; total: number }> {
    return this.listAllPages('/api/storage_paths/', 100, parsePaperlessStoragePath);
  }

  listCustomFields(): Promise<{ items: PaperlessCustomField[]; total: number }> {
    return this.listAllPages('/api/custom_fields/', 100, parsePaperlessCustomField);
  }
}

export { PaperlessUrlValidationError };
