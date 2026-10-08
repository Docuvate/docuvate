#!/usr/bin/env node
/**
 * Ensures a synthetic E2E smoke user (no production data).
 * Used before Playwright compose-smoke authenticated journey.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://127.0.0.1:5173';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const PASSWORD = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';
const NAME = process.env.E2E_SMOKE_NAME ?? 'Alex Testmann';

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
  });
  if (res.ok || res.status === 422) {
    return;
  }
  const text = await res.text();
  throw new Error(`sign-up failed ${res.status}: ${text}`);
}

async function purgeDocuments(userId) {
  const { createRequire } = await import('node:module');
  const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  } finally {
    await pool.end();
  }
}

async function resolveUserId() {
  const { createRequire } = await import('node:module');
  const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const r = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [EMAIL]);
    return r.rows[0]?.id ?? null;
  } finally {
    await pool.end();
  }
}

await ensureUser();
const userId = await resolveUserId();
if (userId) {
  await purgeDocuments(userId);
}
console.log(`E2E smoke user ready: ${EMAIL}`);
