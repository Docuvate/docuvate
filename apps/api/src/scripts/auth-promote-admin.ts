// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import pg from 'pg';

import { INSTALLATION_DB_ROLE_ADMIN } from '../modules/auth/domain/installation.constants.js';

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: auth:promote-admin <email>');
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    const user = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
      [email]
    );
    const userId = user.rows[0]?.id;
    if (!userId) {
      throw new Error(`No user found for email: ${email}`);
    }
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role`,
      [userId, INSTALLATION_DB_ROLE_ADMIN]
    );
    process.stderr.write(`Promoted ${email} to installation administrator\n`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`auth:promote-admin failed: ${message}\n`);
  process.exit(1);
});
