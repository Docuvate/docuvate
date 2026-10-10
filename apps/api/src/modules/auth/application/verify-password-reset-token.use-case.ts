// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  PASSWORD_RESET_DUMMY_VERIFICATION_IDENTIFIER,
  PASSWORD_RESET_TOKEN_MAX_LENGTH,
} from '../domain/password-reset-token.constants.js';

export interface VerifyPasswordResetTokenResult {
  valid: boolean;
}

@Injectable()
export class VerifyPasswordResetTokenUseCase {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async execute(rawToken: string): Promise<VerifyPasswordResetTokenResult> {
    const token = rawToken.trim();
    if (!token || token.length > PASSWORD_RESET_TOKEN_MAX_LENGTH) {
      await this.pool.query(`SELECT "expiresAt" FROM verification WHERE identifier = $1 LIMIT 1`, [
        PASSWORD_RESET_DUMMY_VERIFICATION_IDENTIFIER,
      ]);
      return { valid: false };
    }

    const identifier = `reset-password:${token}`;
    const result = await this.pool.query<{ expiresAt: Date }>(
      `SELECT "expiresAt" FROM verification WHERE identifier = $1 LIMIT 1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      await this.pool.query(`SELECT "expiresAt" FROM verification WHERE identifier = $1 LIMIT 1`, [
        PASSWORD_RESET_DUMMY_VERIFICATION_IDENTIFIER,
      ]);
      return { valid: false };
    }

    const row = result.rows.at(0);
    if (row === undefined) {
      return { valid: false };
    }
    const expiresAt = row.expiresAt;
    if (expiresAt.getTime() < Date.now()) {
      return { valid: false };
    }

    return { valid: true };
  }
}
