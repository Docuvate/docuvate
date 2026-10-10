// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import { PgSftpIngressAuditRepository } from '../infrastructure/pg-sftp-ingress-audit.repository.js';

@Injectable()
export class RecordSftpAuditUseCase {
  constructor(private readonly audit: PgSftpIngressAuditRepository) {}

  execute(input: {
    kind: string;
    username: string;
    clientIp?: string;
    accountId?: string;
  }): Promise<void> {
    const accountIdRaw = input.accountId?.trim() ?? '';
    const accountId = accountIdRaw.length > 0 ? accountIdRaw : null;
    const usernameRaw = input.username.trim();
    const attemptedUsername = accountId ? null : usernameRaw.length > 0 ? usernameRaw : null;
    if (!accountId && !attemptedUsername) {
      return Promise.resolve();
    }
    return this.audit.record({
      kind: input.kind,
      clientIp: (() => {
        const ip = input.clientIp?.trim() ?? '';
        return ip.length > 0 ? ip : null;
      })(),
      accountId,
      attemptedUsername,
    });
  }
}
