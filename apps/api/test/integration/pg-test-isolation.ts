import { randomUUID } from 'node:crypto';

import type pg from 'pg';

/**
 * Per-test isolation via dedicated schema + search_path (supports parallel CI workers later).
 * Migrations run once globally; each test gets a fresh schema with migrated structure copied
 * via pg_dump-less approach: we reuse public schema tables by truncating tenant data only.
 *
 * Template: one synthetic user per test; CASCADE delete on user cleans folders/documents.
 */
export async function insertSyntheticUser(
  client: pg.PoolClient,
  user: { id: string; name: string; email: string }
) {
  await client.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, now(), now())`,
    [user.id, user.name, user.email]
  );
}

export async function deleteSyntheticUser(pool: pg.Pool, userId: string): Promise<void> {
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
}

export function newIsolationUserId(): string {
  return `it_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
