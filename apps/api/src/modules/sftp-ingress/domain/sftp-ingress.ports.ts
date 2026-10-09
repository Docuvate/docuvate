// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CreateSftpIngressAccountInput,
  SftpIngressAccountEntity,
  SftpIngressEventEntity,
  SftpIngressEventStatus,
} from './sftp-ingress.types.js';

export const SFTP_INGRESS_ACCOUNT_REPOSITORY = Symbol('SFTP_INGRESS_ACCOUNT_REPOSITORY');
export const SFTP_INGRESS_EVENT_REPOSITORY = Symbol('SFTP_INGRESS_EVENT_REPOSITORY');

export interface SftpIngressAccountRepository {
  listForUser(userId: string): Promise<SftpIngressAccountEntity[]>;
  findByIdForUser(id: string, userId: string): Promise<SftpIngressAccountEntity | null>;
  findActiveByUsername(username: string): Promise<SftpIngressAccountEntity | null>;
  findActiveById(id: string): Promise<SftpIngressAccountEntity | null>;
  create(
    input: CreateSftpIngressAccountInput & { passwordHash: string | null }
  ): Promise<SftpIngressAccountEntity>;
  revoke(id: string, userId: string): Promise<boolean>;
}

export interface SftpIngressEventRepository {
  listForAccount(
    accountId: string,
    userId: string,
    limit: number
  ): Promise<SftpIngressEventEntity[]>;
  create(input: {
    accountId: string;
    userId: string;
    filename: string;
    remotePath: string | null;
    status: SftpIngressEventStatus;
    reasonKey?: string | null;
    reasonDetail?: string | null;
    documentId?: string | null;
  }): Promise<SftpIngressEventEntity>;
}
