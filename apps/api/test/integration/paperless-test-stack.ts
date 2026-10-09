import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const composeFile = join(root, 'tools/paperless-test/docker-compose.paperless-test.yml');
const manifestPath = join(root, 'tools/paperless-test/seed-manifest.json');

export type PaperlessSeedManifest = {
  baseUrl: string;
  token: string;
  username: string;
  documentCount: number;
  customFieldId: number | null;
};

async function obtainPaperlessToken(baseUrl: string, attempts = 20): Promise<string> {
  const username = process.env.PAPERLESS_TEST_USER ?? 'docuvate-test';
  const password = process.env.PAPERLESS_TEST_PASSWORD ?? 'docuvate-test-secret';
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`token status ${response.status}`);
      }
      const body = (await response.json()) as { token?: string };
      const token = body.token?.trim();
      if (!token) {
        throw new Error('token missing');
      }
      return token;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('token failed after retries');
}

async function waitForPaperless(baseUrl: string, timeoutMs = 600_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const token = await obtainPaperlessToken(baseUrl);
      for (const version of [3, 2, 0]) {
        const accept = version === 0 ? 'application/json' : `application/json; version=${version}`;
        const response = await fetch(`${baseUrl}/api/documents/?page=1&page_size=1`, {
          headers: {
            Authorization: `Token ${token}`,
            Accept: accept,
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          return;
        }
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  throw new Error('Paperless test stack did not become ready');
}

export async function ensurePaperlessTestStack(): Promise<PaperlessSeedManifest> {
  const baseUrl = (process.env.PAPERLESS_TEST_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');
  if (!process.env.PAPERLESS_TEST_SKIP_COMPOSE) {
    execFileSync('docker', ['compose', '-f', composeFile, 'up', '-d'], {
      cwd: root,
      stdio: 'inherit',
      timeout: 600_000,
    });
  }
  await waitForPaperless(baseUrl);
  if (!existsSync(manifestPath) || process.env.PAPERLESS_TEST_RESEED === '1') {
    execFileSync('node', [join(root, 'tools/paperless-test/seed.mjs')], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, PAPERLESS_TEST_URL: baseUrl },
      timeout: 600_000,
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Omit<
    PaperlessSeedManifest,
    'token'
  >;
  const token = await obtainPaperlessToken(baseUrl);
  return { ...manifest, baseUrl, token };
}

export function teardownPaperlessTestStack(): void {
  if (process.env.PAPERLESS_TEST_KEEP === '1') {
    return;
  }
  execFileSync('docker', ['compose', '-f', composeFile, 'down'], {
    cwd: root,
    stdio: 'inherit',
    timeout: 120_000,
  });
}
