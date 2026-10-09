#!/usr/bin/env node
/**
 * Seeds SFTP ingress demo data for UI screenshots (synthetic credentials only).
 * SFTP_SCREENSHOT_ACCOUNT_COUNT=1|2 (default 1).
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/api/package.json'),
);
const pg = require('pg');
const { hash } = require('@node-rs/argon2');

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@localhost:5433/docuvate';
const authBase = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
/** Fixture admin from tools/screenshots/admin/seed-admin-screenshots.mjs (invite-only auth). */
const seedEmail = process.env.SEED_EMAIL ?? 'elena.kraemer@beispiel.de';
const seedPassword = process.env.SEED_PASSWORD ?? 'AdminDemo12!';
const seedName = process.env.SEED_NAME ?? 'Elena Krämer';
const accountCount = Math.min(2, Math.max(1, Number(process.env.SFTP_SCREENSHOT_ACCOUNT_COUNT ?? '1') || 1));

const DEMO_USERNAMES = ['buero-scanner', 'konferenz-scanner'];

async function ensureUser(pool) {
  const signIn = await fetch(`${authBase}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: webOrigin },
    body: JSON.stringify({ email: seedEmail, password: seedPassword }),
  });
  if (!signIn.ok) {
    const text = await signIn.text();
    throw new Error(
      `sign-in failed ${signIn.status} for ${seedEmail}: ${text}. Run tools/screenshots/admin/seed-admin-screenshots.mjs first.`,
    );
  }
  const row = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [seedEmail]);
  const userId = row.rows[0]?.id;
  if (!userId) {
    throw new Error(`No user ${seedEmail}; seed the fixture admin before SFTP screenshots`);
  }
  return userId;
}

async function ensureInboxFolder(pool, userId) {
  const existing = await pool.query(
    `SELECT id FROM folders WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId],
  );
  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }
  const folderId = randomUUID();
  await pool.query(
    `INSERT INTO folders (id, user_id, name, created_at, updated_at) VALUES ($1, $2, $3, now(), now())`,
    [folderId, userId, 'Posteingang'],
  );
  return folderId;
}

async function main() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const userId = await ensureUser(pool);
  const folderId = await ensureInboxFolder(pool, userId);
  const passwordHash = await hash('synthetic-not-used-in-shots', {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const username of DEMO_USERNAMES) {
    await pool.query(
      `DELETE FROM sftp_ingress_events WHERE account_id IN (
      SELECT id FROM sftp_ingress_accounts WHERE user_id = $1 AND lower(username) = lower($2)
    )`,
      [userId, username],
    );
    await pool.query(
      `DELETE FROM sftp_ingress_account_labels WHERE account_id IN (
      SELECT id FROM sftp_ingress_accounts WHERE user_id = $1 AND lower(username) = lower($2)
    )`,
      [userId, username],
    );
    await pool.query(`DELETE FROM sftp_ingress_accounts WHERE user_id = $1 AND lower(username) = lower($2)`, [
      userId,
      username,
    ]);
  }

  const accounts = [
    { name: 'Bürodrucker', username: 'buero-scanner', hoursAgo: 2 },
    { name: 'Konferenzraum', username: 'konferenz-scanner', hoursAgo: 5 },
  ].slice(0, accountCount);

  for (const row of accounts) {
    const accountId = randomUUID();
    await pool.query(
      `INSERT INTO sftp_ingress_accounts (id, user_id, display_name, username, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [accountId, userId, row.name, row.username, passwordHash],
    );
    await pool.query(
      `INSERT INTO sftp_ingress_events (id, account_id, filename, status, created_at)
       VALUES ($1, $2, 'Rechnung_Stadtwerke_2026-09.pdf', 'processed', now() - ($3::text || ' hours')::interval)`,
      [randomUUID(), accountId, String(row.hoursAgo)],
    );
  }

  const docFilename = 'Rechnung_Stadtwerke_2026-09.pdf';
  const docTitle = 'Stadtwerke Rechnung September 2026';
  await pool.query(`DELETE FROM documents WHERE user_id = $1 AND filename = $2`, [userId, docFilename]);
  const docId = randomUUID();
  await pool.query(
    `INSERT INTO documents (
       id, user_id, filename, mime_type, storage_key, status, extracted_text, title, ingest_source, folder_id, updated_at
     ) VALUES ($1, $2, $3, 'application/pdf', $4, 'ready', $5, $6, 'scanner_sftp', $7, now())`,
    [
      docId,
      userId,
      docFilename,
      `seed/${docId}.pdf`,
      'Rechnungsbetrag 142,80 EUR · Verbrauchskonto · fällig 15.10.2026.',
      docTitle,
      folderId,
    ],
  );

  await pool.end();
  console.log(`SFTP screenshot seed applied for ${seedEmail} (${accountCount} account(s))`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
