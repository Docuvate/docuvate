// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { DEFAULT_PASSWORD_POLICY, normalizePasswordPolicy } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  type InstallationPasswordPolicyRow,
  passwordPolicyFromRow,
} from '../domain/password-policy-row.js';

const SINGLETON_KEY = 'default';

@Injectable()
export class PgInstallationPasswordPolicyRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async getPolicy(): Promise<PasswordPolicyDto> {
    const result = await this.pool.query<InstallationPasswordPolicyRow>(
      `SELECT min_length, require_lower, require_upper, require_digit, require_symbol, check_breached
       FROM installation_password_policy
       WHERE singleton_key = $1`,
      [SINGLETON_KEY]
    );
    const row = result.rows.at(0);
    if (!row) {
      return DEFAULT_PASSWORD_POLICY;
    }
    return passwordPolicyFromRow(row);
  }

  async updatePolicy(patch: PasswordPolicyDto): Promise<PasswordPolicyDto> {
    const next = normalizePasswordPolicy(patch);
    const result = await this.pool.query<InstallationPasswordPolicyRow>(
      `UPDATE installation_password_policy
       SET min_length = $2,
           require_lower = $3,
           require_upper = $4,
           require_digit = $5,
           require_symbol = $6,
           check_breached = $7,
           updated_at = now()
       WHERE singleton_key = $1
       RETURNING min_length, require_lower, require_upper, require_digit, require_symbol, check_breached`,
      [
        SINGLETON_KEY,
        next.minLength,
        next.requireLower,
        next.requireUpper,
        next.requireDigit,
        next.requireSymbol,
        next.checkBreached,
      ]
    );
    const row = result.rows.at(0);
    if (!row) {
      return next;
    }
    return passwordPolicyFromRow(row);
  }
}
