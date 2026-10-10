// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { resolveSftpIngestServiceKey } from '../../../../../shared/infrastructure/auth/sftp-ingest-service-key.js';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import { parseSftpListResponse, parseSftpProbeResponse } from './sftp-pull-response.js';

const MAX_FETCH_BYTES = 26_214_400;
const REQUEST_TIMEOUT_MS = 120_000;

function pullBaseUrl(): string {
  return (process.env.DOCUVATE_SFTP_PULL_GATEWAY_URL ?? 'http://sftp-ingest:8080').replace(
    /\/$/,
    ''
  );
}

function serviceKey(): string {
  return resolveSftpIngestServiceKey() ?? process.env.DOCUVATE_SERVICE_API_KEY ?? '';
}

function headers(): Record<string, string> {
  const key = serviceKey();
  return key ? { 'X-Docuvate-Api-Key': key } : {};
}

function readConfigString(input: ConnectorConfigurationInput, key: string): string {
  const value = input[key];
  return typeof value === 'string' ? value : '';
}

function bodyFromConfig(input: ConnectorConfigurationInput) {
  const portRaw = readConfigString(input, 'port');
  const parsedPort = portRaw ? Number(portRaw) : 22;
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 22;
  const remotePath = readConfigString(input, 'remote_path').trim();
  return {
    host: readConfigString(input, 'host').trim(),
    port,
    username: readConfigString(input, 'username').trim(),
    password: readConfigString(input, 'password'),
    privateKey: readConfigString(input, 'private_key'),
    remotePath: remotePath || '/',
    hostKeyFingerprint: readConfigString(input, 'host_key_fingerprint').trim(),
  };
}

function mergeFetchHeaders(init: RequestInit): Record<string, string> {
  const merged: Record<string, string> = { ...headers() };
  const raw = init.headers;
  if (!raw) {
    return merged;
  }
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      merged[key] = value;
    });
    return merged;
  }
  if (Array.isArray(raw)) {
    for (const [key, value] of raw) {
      merged[key] = value;
    }
    return merged;
  }
  return { ...merged, ...raw };
}

async function gatewayFetch(
  path: string,
  init: RequestInit & { json?: unknown }
): Promise<Response> {
  const { json, body, method, ...rest } = init;
  const res = await fetch(`${pullBaseUrl()}${path}`, {
    ...rest,
    method,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      ...mergeFetchHeaders(init),
      ...(json ? { 'Content-Type': 'application/json' } : {}),
    },
    body: json ? JSON.stringify(json) : body,
  });
  return res;
}

export async function probeSftpPullHostKey(
  input: ConnectorConfigurationInput
): Promise<{ hostKeyFingerprintSha256: string }> {
  const res = await gatewayFetch('/pull/probe', {
    method: 'POST',
    json: bodyFromConfig(input),
  });
  if (!res.ok) {
    throw new Error('SFTP_PROBE_FAILED');
  }
  return parseSftpProbeResponse(await res.json());
}

export async function listSftpPullFiles(
  input: ConnectorConfigurationInput,
  limit: number
): Promise<{ path: string; name: string; sizeBytes: number }[]> {
  const res = await gatewayFetch('/pull/list', {
    method: 'POST',
    json: { ...bodyFromConfig(input), limit },
  });
  if (!res.ok) {
    throw new Error('SFTP_LIST_FAILED');
  }
  return parseSftpListResponse(await res.json());
}

export async function fetchSftpPullFile(
  input: ConnectorConfigurationInput,
  ref: string
): Promise<Buffer> {
  const res = await gatewayFetch('/pull/fetch', {
    method: 'POST',
    json: { ...bodyFromConfig(input), ref },
  });
  if (!res.ok) {
    throw new Error('SFTP_FETCH_FAILED');
  }
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('SFTP_FETCH_FAILED');
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FETCH_BYTES) {
      throw new Error('SFTP_FETCH_TOO_LARGE');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export async function postProcessSftpPullFile(
  input: ConnectorConfigurationInput,
  ref: string,
  filename: string,
  afterImport: string,
  archivePath: string
): Promise<void> {
  const res = await gatewayFetch('/pull/post-process', {
    method: 'POST',
    json: {
      ...bodyFromConfig(input),
      ref,
      filename,
      afterImport,
      archivePath,
    },
  });
  if (!res.ok) {
    throw new Error('SFTP_POST_PROCESS_FAILED');
  }
}
