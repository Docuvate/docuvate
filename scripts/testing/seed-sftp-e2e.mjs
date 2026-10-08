#!/usr/bin/env node
/**
 * Seeds SFTP E2E accounts (upload + lockout) for Go integration tests.
 * Requires postgres + migrated schema; creates local-dev-owner if missing.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/api/package.json'));
const pg = require('pg');
const { hash } = require('@node-rs/argon2');

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@localhost:5433/docuvate';
const ownerId = process.env.DOCUVATE_E2E_USER_ID ?? 'local-dev-owner';
const uploadUser = 'e2e-scan-upload';
const lockoutUser = 'e2e-scan-lockout';
const uploadPassword = process.env.DOCUVATE_SFTP_E2E_PASSWORD ?? 'E2eSftpUpload9!';
const lockoutPassword = 'correct-but-unused';

async function hashPassword(plain) {
  return hash(plain, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

async function main() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, now(), now())
     ON CONFLICT (id) DO NOTHING`,
    [ownerId, 'E2E Owner', 'e2e-owner@fixture.docuvate.test']
  );
  const uploadHash = await hashPassword(uploadPassword);
  const lockoutHash = await hashPassword(lockoutPassword);
  for (const row of [
    { username: uploadUser, displayName: 'E2E Upload', passwordHash: uploadHash },
    { username: lockoutUser, displayName: 'E2E Lockout', passwordHash: lockoutHash },
  ]) {
    await pool.query(
      `DELETE FROM sftp_ingress_accounts WHERE lower(username) = lower($1)`,
      [row.username]
    );
    await pool.query(
      `INSERT INTO sftp_ingress_accounts (user_id, display_name, username, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [ownerId, row.displayName, row.username, row.passwordHash]
    );
  }
  await pool.end();
  console.log(
    JSON.stringify({
      ownerId,
      uploadUser,
      uploadPassword,
      lockoutUser,
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
