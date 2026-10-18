// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { DEFAULT_PASSWORD_POLICY } from '@docuvate/contracts';
import type pg from 'pg';

import { type InstallationPasswordPolicyRow,passwordPolicyFromRow } from '../domain/password-policy-row.js';

let cachedPolicy: PasswordPolicyDto | null = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 5_000;

export function invalidateRuntimePasswordPolicyCache(): void {
  cachedPolicy = null;
  cachedAtMs = 0;
}

export async function loadPasswordPolicyForPool(pool: pg.Pool): Promise<PasswordPolicyDto> {
  const now = Date.now();
  if (cachedPolicy && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedPolicy;
  }
  const result = await pool.query<InstallationPasswordPolicyRow>(
    `SELECT min_length, require_lower, require_upper, require_digit, require_symbol, check_breached
     FROM installation_password_policy
     WHERE singleton_key = 'default'`
  );
  const row = result.rows.at(0);
  cachedPolicy = row ? passwordPolicyFromRow(row) : DEFAULT_PASSWORD_POLICY;
  cachedAtMs = now;
  return cachedPolicy;
}
