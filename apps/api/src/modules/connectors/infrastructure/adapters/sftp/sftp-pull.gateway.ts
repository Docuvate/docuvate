import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';

function pullBaseUrl(): string {
  return (process.env['DOCUVATE_SFTP_PULL_GATEWAY_URL'] ?? 'http://sftp-ingest:8080').replace(
    /\/$/,
    ''
  );
}

function serviceKey(): string {
  return process.env['DOCUVATE_SFTP_INGEST_SERVICE_KEY'] ?? process.env['DOCUVATE_SERVICE_API_KEY'] ?? '';
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

export async function probeSftpPullHostKey(
  input: ConnectorConfigurationInput
): Promise<{ hostKeyFingerprintSha256: string }> {
  const res = await fetch(`${pullBaseUrl()}/pull/probe`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyFromConfig(input)),
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
  const res = await fetch(`${pullBaseUrl()}/pull/list`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...bodyFromConfig(input), limit }),
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
  const res = await fetch(`${pullBaseUrl()}/pull/fetch`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...bodyFromConfig(input), ref }),
  });
  if (!res.ok) {
    throw new Error('SFTP_FETCH_FAILED');
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function postProcessSftpPullFile(
  input: ConnectorConfigurationInput,
  ref: string,
  filename: string,
  afterImport: string,
  archivePath: string
): Promise<void> {
  const res = await fetch(`${pullBaseUrl()}/pull/post-process`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...bodyFromConfig(input),
      ref,
      filename,
      afterImport,
      archivePath,
    }),
  });
  if (!res.ok) {
    throw new Error('SFTP_POST_PROCESS_FAILED');
  }
}
