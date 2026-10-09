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
    const accountId = input.accountId?.trim() || null;
    const attemptedUsername = accountId ? null : input.username?.trim() || null;
    if (!accountId && !attemptedUsername) {
      return Promise.resolve();
    }
    return this.audit.record({
      kind: input.kind,
      clientIp: input.clientIp?.trim() || null,
      accountId,
      attemptedUsername,
    });
  }
}
