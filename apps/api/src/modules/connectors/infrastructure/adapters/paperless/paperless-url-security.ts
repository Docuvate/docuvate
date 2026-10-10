// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { connectorFetch, trimTrailingSlash } from '../shared/connector-http.js';

const MAX_REDIRECT_HOPS = 3;
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
const MAX_LIST_PAGES = 500;
const MAX_LIST_ITEMS = 50_000;

export { MAX_DOWNLOAD_BYTES, MAX_LIST_ITEMS,MAX_LIST_PAGES };

export class PaperlessUrlValidationError extends Error {
  constructor(readonly messageKey: string) {
    super(messageKey);
    this.name = 'PaperlessUrlValidationError';
  }
}

function allowPrivateNetworks(): boolean {
  const raw = process.env['DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS'];
  if (raw === undefined || raw === '') {
    return true;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function isMetadataAddress(ip: string): boolean {
  if (ip === '0.0.0.0' || ip.startsWith('0.')) {
    return true;
  }
  if (ip.startsWith('169.254.')) {
    return true;
  }
  if (ip.toLowerCase() === 'fd00:ec2::254') {
    return true;
  }
  if (ip.toLowerCase().startsWith('fe80:')) {
    return true;
  }
  return false;
}

function isPrivateAddress(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') {
    return true;
  }
  if (ip.startsWith('10.')) {
    return true;
  }
  if (ip.startsWith('192.168.')) {
    return true;
  }
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  if (ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  return false;
}

function assertIpAllowed(ip: string): void {
  if (isMetadataAddress(ip)) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlMetadataBlocked');
  }
  if (!allowPrivateNetworks() && isPrivateAddress(ip)) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlPrivateBlocked');
  }
}

export function normalizePaperlessBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlInvalid');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlInvalid');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlScheme');
  }
  if (parsed.username || parsed.password) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlUserinfo');
  }
  if (parsed.search || parsed.hash) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlQueryFragment');
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname = path || '';
  return trimTrailingSlash(parsed.toString().replace(/\/$/, ''));
}

export async function assertPaperlessHostResolvable(baseUrl: string): Promise<void> {
  const host = new URL(baseUrl).hostname;
  if (isIP(host)) {
    assertIpAllowed(host);
    return;
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (records.length === 0) {
    throw new PaperlessUrlValidationError('connectors.paperless.errors.urlHostUnresolved');
  }
  for (const record of records) {
    assertIpAllowed(record.address);
  }
}

export async function validatePaperlessBaseUrl(raw: string): Promise<string> {
  const normalized = normalizePaperlessBaseUrl(raw);
  await assertPaperlessHostResolvable(normalized);
  return normalized;
}

function resolveRedirectUrl(base: string, location: string): string {
  return new URL(location, base).toString();
}

export async function paperlessSafeFetch(
  baseUrl: string,
  pathOrUrl: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const target = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : new URL(pathOrUrl, `${baseUrl}/`).toString();
  let current = target;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    const normalized = normalizePaperlessBaseUrl(current.split('?')[0] ?? current);
    await assertPaperlessHostResolvable(normalized);
    const response = await connectorFetch(current, { ...init, redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new PaperlessUrlValidationError('connectors.paperless.errors.urlRedirectInvalid');
      }
      if (hop >= MAX_REDIRECT_HOPS) {
        throw new PaperlessUrlValidationError('connectors.paperless.errors.urlRedirectLimit');
      }
      current = resolveRedirectUrl(current, location);
      continue;
    }
    return response;
  }
  throw new PaperlessUrlValidationError('connectors.paperless.errors.urlRedirectLimit');
}

export async function readResponseWithSizeCap(
  response: Response,
  maxBytes: number
): Promise<Buffer> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const len = Number(contentLength);
    if (Number.isFinite(len) && len > maxBytes) {
      throw new Error('PAPERLESS_DOWNLOAD_TOO_LARGE');
    }
  }
  if (!response.body) {
    return Buffer.alloc(0);
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error('PAPERLESS_DOWNLOAD_TOO_LARGE');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
