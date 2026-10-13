// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class DocumentChatCloudUrlError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'DocumentChatCloudUrlError';
  }
}

export function documentChatCloudHttpAllowed(): boolean {
  const raw = process.env['DOCUMENT_CHAT_CLOUD_ALLOW_HTTP']?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function documentChatCloudAllowedHostnames(): Set<string> {
  const raw = process.env['DOCUMENT_CHAT_CLOUD_ALLOWED_HOSTS'] ?? '';
  return new Set(
    raw
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0)
  );
}

function hostnameHasTld(hostname: string): boolean {
  if (isIP(hostname)) {
    return false;
  }
  const lower = hostname.toLowerCase();
  if (!lower.includes('.')) {
    return false;
  }
  const labels = lower.split('.');
  const tld = labels[labels.length - 1];
  return tld.length >= 2 && /^[a-z]+$/.test(tld);
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

function isPrivateOrLoopbackAddress(ip: string): boolean {
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

function assertIpAllowed(ip: string, hostname: string): void {
  const allowedHosts = documentChatCloudAllowedHostnames();
  const hostAllowed = allowedHosts.has(hostname.toLowerCase());
  if (hostAllowed) {
    return;
  }
  if (isMetadataAddress(ip) || isPrivateOrLoopbackAddress(ip)) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_private_blocked');
  }
}

export function normalizeDocumentChatCloudBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_invalid');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_invalid');
  }
  const allowHttp = documentChatCloudHttpAllowed();
  if (parsed.protocol === 'https:') {
    // ok
  } else if (parsed.protocol === 'http:' && allowHttp) {
    // ok
  } else {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_scheme');
  }
  if (parsed.username || parsed.password) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_userinfo');
  }
  if (parsed.search || parsed.hash) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_query_fragment');
  }
  if (!hostnameHasTld(parsed.hostname)) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_tld');
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname = path || '';
  return parsed.toString().replace(/\/$/, '');
}

export function validateDocumentChatCloudBaseUrlSync(raw: string): string | null {
  try {
    normalizeDocumentChatCloudBaseUrl(raw);
    return null;
  } catch (err) {
    if (err instanceof DocumentChatCloudUrlError) {
      return err.code;
    }
    return 'document_chat_cloud_url_invalid';
  }
}

export async function assertDocumentChatCloudHostResolvable(baseUrl: string): Promise<void> {
  const host = new URL(baseUrl).hostname;
  if (isIP(host)) {
    assertIpAllowed(host, host);
    return;
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (records.length === 0) {
    throw new DocumentChatCloudUrlError('document_chat_cloud_url_unresolved');
  }
  for (const record of records) {
    assertIpAllowed(record.address, host);
  }
}

export async function validateDocumentChatCloudBaseUrl(raw: string): Promise<string> {
  const normalized = normalizeDocumentChatCloudBaseUrl(raw);
  await assertDocumentChatCloudHostResolvable(normalized);
  return normalized;
}

export function openAiCompatibleChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1')) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}
