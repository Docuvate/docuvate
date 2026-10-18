// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { SftpIngressAccountsEntity } from './sftp-ingress-accounts.entity.js';

@Index('sftp_ingress_audit_pkey', ['id'], { unique: true })
@Index('sftp_ingress_audit_created_idx', ['createdAt'], {})
@Entity('sftp_ingress_audit', { schema: 'public' })
export class SftpIngressAuditEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'kind' })
  kind: string;

  @Column('text', { name: 'attempted_username', nullable: true })
  attemptedUsername: string | null;

  @Column('text', { name: 'client_ip', nullable: true })
  clientIp: string | null;

  @Column('uuid', { name: 'account_id', nullable: true })
  accountId: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => SftpIngressAccountsEntity, (account) => account.auditEntries, {
    onDelete: 'SET NULL',
  })
  @JoinColumn([{ name: 'account_id', referencedColumnName: 'id' }])
  account: SftpIngressAccountsEntity | null;
}
