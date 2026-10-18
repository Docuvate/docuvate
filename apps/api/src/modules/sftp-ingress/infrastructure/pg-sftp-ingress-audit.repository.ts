// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

@Injectable()
export class PgSftpIngressAuditRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async record(input: {
    kind: string;
    clientIp: string | null;
    accountId: string | null;
    attemptedUsername: string | null;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO sftp_ingress_audit (kind, attempted_username, client_ip, account_id)
       VALUES ($1, $2, $3, $4)`,
      [input.kind, input.attemptedUsername, input.clientIp, input.accountId]
    );
  }
}
