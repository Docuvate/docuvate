import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';
import { resolveSftpIngestServiceKey } from '../../../../../shared/infrastructure/auth/sftp-ingest-service-key.js';

const MAX_FETCH_BYTES = 26_214_400;
const REQUEST_TIMEOUT_MS = 120_000;

function pullBaseUrl(): string {
  return (process.env['DOCUVATE_SFTP_PULL_GATEWAY_URL'] ?? 'http://sftp-ingest:8080').replace(
    /\/$/,
    ''
  );
}

function serviceKey(): string {
  return resolveSftpIngestServiceKey() ?? process.env['DOCUVATE_SERVICE_API_KEY'] ?? '';
}

function headers(): Record<string, string> {
  const key = serviceKey();
  return key ? { 'X-Docuvate-Api-Key': key } : {};
}

function bodyFromConfig(input: ConnectorConfigurationInput) {
  return {
    host: input['host']?.trim() ?? '',
    port: Number(input['port'] ?? 22) || 22,
    username: input['username']?.trim() ?? '',
    password: input['password'] ?? '',
    privateKey: input['private_key'] ?? '',
    remotePath: input['remote_path']?.trim() || '/',
    hostKeyFingerprint: input['host_key_fingerprint']?.trim() ?? '',
  };
}

async function gatewayFetch(
  path: string,
  init: RequestInit & { json?: unknown }
): Promise<Response> {
  const { json, ...rest } = init;
  const res = await fetch(`${pullBaseUrl()}${path}`, {
    ...rest,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      ...headers(),
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
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
  return (await res.json()) as { hostKeyFingerprintSha256: string };
}

export async function listSftpPullFiles(
  input: ConnectorConfigurationInput,
  limit: number
): Promise<Array<{ path: string; name: string; sizeBytes: number }>> {
  const res = await gatewayFetch('/pull/list', {
    method: 'POST',
    json: { ...bodyFromConfig(input), limit },
  });
  if (!res.ok) {
    throw new Error('SFTP_LIST_FAILED');
  }
  const parsed = (await res.json()) as { files: Array<{ Path: string; Name: string; SizeBytes: number }> };
  return (parsed.files ?? []).map((f) => ({
    path: f.Path ?? (f as unknown as { path: string }).path,
    name: f.Name ?? (f as unknown as { name: string }).name,
    sizeBytes: f.SizeBytes ?? (f as unknown as { sizeBytes: number }).sizeBytes,
  }));
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
    if (!value) continue;
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
