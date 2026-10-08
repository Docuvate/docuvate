#!/usr/bin/env node
/**
 * Synthetic seed for UX metrics (neutral @lokal.invalid user). Prints one JSON line to stdout.
 */
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const pg = require('pg');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '../..');

const EMAIL = process.env.SEED_EMAIL ?? 'katalog.metrik@lokal.invalid';
const PASSWORD = process.env.SEED_PASSWORD ?? 'MetrikLauf7!';
const DISPLAY_NAME = 'Metrik Lauf';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://localhost:3001';
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const METRICS_FOLDER = process.env.METRICS_FOLDER_NAME ?? 'Metrik Ablage';
const METRICS_MAPPE = process.env.METRICS_MAPPE_NAME ?? 'Metrik Mappe';

async function ensureMetricsUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: WEB_ORIGIN,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: DISPLAY_NAME }),
  });
  if (res.ok || res.status === 422) {
    return;
  }
  const text = await res.text();
  throw new Error(`sign-up failed ${res.status}: ${text}`);
}

async function signInCookie() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (!res.ok || cookies.length === 0) {
    throw new Error(`sign-in failed ${res.status}`);
  }
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function authed(cookie, apiPath, init = {}) {
  const res = await fetch(`${API}${apiPath}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Cookie: cookie,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${apiPath} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function ensureFolder(cookie) {
  const mappen = await authed(cookie, '/mappen');
  let mappe = (mappen.items ?? []).find((m) => m.name === METRICS_MAPPE);
  if (!mappe) {
    mappe = await authed(cookie, '/mappen', {
      method: 'POST',
      body: JSON.stringify({ name: METRICS_MAPPE }),
    });
  }
  const folders = await authed(cookie, '/folders');
  let folder = (folders.items ?? []).find(
    (f) => f.name === METRICS_FOLDER && f.mappeId === mappe.id && !f.parentId
  );
  if (!folder) {
    folder = await authed(cookie, '/folders', {
      method: 'POST',
      body: JSON.stringify({ name: METRICS_FOLDER, mappeId: mappe.id, parentId: null }),
    });
  }
  return folder;
}

async function main() {
  if (process.env.SKIP_LABELS_SEED !== '1') {
    await ensureMetricsUser();
    execSync('node scripts/seed-labels-screenshots.mjs', {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        SEED_EMAIL: EMAIL,
        SEED_PASSWORD: PASSWORD,
        DATABASE_URL,
        AUTH_BASE,
        WEB_ORIGIN,
      },
    });
  }

  const cookie = await signInCookie();
  await ensureFolder(cookie);

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const userRes = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [EMAIL]);
  const userId = userRes.rows[0]?.id;
  const docRes = await pool.query(
    `SELECT id, title FROM documents WHERE user_id = $1 AND title LIKE 'Finanzplan%' ORDER BY updated_at DESC LIMIT 1`,
    [userId]
  );
  await pool.end();

  const doc = docRes.rows[0];
  if (!doc) {
    throw new Error('No seeded document found');
  }

  const payload = {
    email: EMAIL,
    password: PASSWORD,
    sampleDocumentTitle: doc.title,
    sampleDocumentId: doc.id,
    metricsFolderName: METRICS_FOLDER,
  };
  console.log(JSON.stringify(payload));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
