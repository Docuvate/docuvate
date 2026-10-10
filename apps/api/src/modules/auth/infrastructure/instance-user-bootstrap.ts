// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import {
  INSTALLATION_DB_ROLE_ADMIN,
  INSTALLATION_DB_ROLE_MEMBER,
} from '../domain/installation.constants.js';

const FIRST_USER_LOCK_KEY = 8_201_008;

/** Assign installation role after better-auth creates the user row (first admin when none exists). */
export async function assignInstallationRoleAfterSignUp(
  pool: pg.Pool,
  userId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock($1)`, [FIRST_USER_LOCK_KEY]);
    const adminExists = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM installation_user_roles WHERE role = $1
       ) AS exists`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    const role =
      (adminExists.rows[0]?.exists)
        ? INSTALLATION_DB_ROLE_MEMBER
        : INSTALLATION_DB_ROLE_ADMIN;
    await client.query(
      `INSERT INTO installation_user_roles (user_id, role)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, role]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
