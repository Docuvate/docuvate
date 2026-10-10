// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FoldersEntity } from './folders.entity.js';
import { SftpIngressAccountLabelsEntity } from './sftp-ingress-account-labels.entity.js';
import { SftpIngressAuditEntity } from './sftp-ingress-audit.entity.js';
import { SftpIngressEventsEntity } from './sftp-ingress-events.entity.js';
import { UserEntity } from './user.entity.js';

@Index('sftp_ingress_accounts_pkey', ['id'], { unique: true })
@Index('sftp_ingress_accounts_user_idx', ['userId', 'createdAt'], {})
@Entity('sftp_ingress_accounts', { schema: 'public' })
export class SftpIngressAccountsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'display_name' })
  displayName: string;

  @Column('text', { name: 'username' })
  username: string;

  @Column('text', { name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column('text', { name: 'ssh_public_key', nullable: true })
  sshPublicKey: string | null;

  @Column('uuid', { name: 'folder_id', nullable: true })
  folderId: string | null;

  @Column('boolean', { name: 'map_subfolders', default: () => 'false' })
  mapSubfolders: boolean;

  @Column('timestamp with time zone', { name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => FoldersEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn([{ name: 'folder_id', referencedColumnName: 'id' }])
  folder: FoldersEntity | null;

  @OneToMany(() => SftpIngressAccountLabelsEntity, (labels) => labels.account)
  accountLabels: SftpIngressAccountLabelsEntity[];

  @OneToMany(() => SftpIngressEventsEntity, (events) => events.account)
  events: SftpIngressEventsEntity[];

  @OneToMany(() => SftpIngressAuditEntity, (audit) => audit.account)
  auditEntries: SftpIngressAuditEntity[];
}
