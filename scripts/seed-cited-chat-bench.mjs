#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
/**
 * Seeds the E2E smoke user with German cited-chat bench documents (ADR 024).
 * Idempotent: purges prior documents for the user, then inserts four fixtures.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://127.0.0.1:5173';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const PASSWORD = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';
const NAME = process.env.E2E_SMOKE_NAME ?? 'Alex Testmann';

const FIXTURES = [
  {
    filename: 'rechnung-nordwind.pdf',
    title: 'Rechnung Nordwind GmbH',
    text: 'Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000',
  },
  {
    filename: 'mietvertrag.pdf',
    title: 'Mietvertrag Wohnung',
    text: 'Mietvertrag Wohnung\nDie Miete ist bis zum 3. Werktag des Monats fällig.',
  },
  {
    filename: 'arbeitsvertrag.pdf',
    title: 'Arbeitsvertrag',
    text: 'Arbeitsvertrag\nDie Kündigungsfrist beträgt drei Monate zum Quartalsende.',
  },
  {
    filename: 'hundesteuer.pdf',
    title: 'Bescheid Hundesteuer',
    text: 'Bescheid Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR',
  },
];

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`sign-up failed ${res.status}: ${await res.text()}`);
  }
}

async function withPool(fn) {
  const { createRequire } = await import('node:module');
  const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

async function purgeDocuments(pool, userId) {
  await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
}

function splitChunks(text) {
  const max = 1200;
  const chunks = [];
  for (let i = 0; i < text.length; i += max) {
    const body = text.slice(i, i + max);
    chunks.push({
      body,
      charStart: i,
      charEnd: i + body.length,
      page: 1,
    });
  }
  return chunks;
}

async function indexDocument(pool, userId, fixture) {
  const docId = randomUUID();
  await pool.query(
    `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
     VALUES ($1, $2, $3, $4, 'application/pdf', $5, 'ready', $6)`,
    [docId, userId, fixture.filename, fixture.title, `bench/${fixture.filename}`, fixture.text]
  );
  const chunks = splitChunks(fixture.text);
  for (let i = 0; i < chunks.length; i += 1) {
    const c = chunks[i];
    await pool.query(
      `INSERT INTO document_text_chunks (document_id, user_id, chunk_index, body, page, char_start, char_end, search_vector)
       VALUES ($1, $2, $3, $4, $5, $6, $7, to_tsvector('simple', $4))`,
      [docId, userId, i, c.body, c.page, c.charStart, c.charEnd]
    );
  }
  return docId;
}

await ensureUser();
await withPool(async (pool) => {
  const user = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [EMAIL]);
  const userId = user.rows[0]?.id;
  if (!userId) {
    throw new Error(`user not found: ${EMAIL}`);
  }
  await purgeDocuments(pool, userId);
  for (const fixture of FIXTURES) {
    await indexDocument(pool, userId, fixture);
  }
});
console.log(`Cited-chat bench fixtures ready for ${EMAIL}`);
