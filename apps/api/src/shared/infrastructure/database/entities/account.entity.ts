// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('account', { schema: 'public' })
export class AccountEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('text', { name: 'accountId' })
  accountId: string;

  @Column('text', { name: 'providerId' })
  providerId: string;

  @Column('text', { name: 'accessToken', nullable: true })
  accessToken: string | null;

  @Column('text', { name: 'refreshToken', nullable: true })
  refreshToken: string | null;

  @Column('text', { name: 'idToken', nullable: true })
  idToken: string | null;

  @Column('timestamp with time zone', {
    name: 'accessTokenExpiresAt',
    nullable: true,
  })
  accessTokenExpiresAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'refreshTokenExpiresAt',
    nullable: true,
  })
  refreshTokenExpiresAt: Date | null;

  @Column('text', { name: 'scope', nullable: true })
  scope: string | null;

  @Column('text', { name: 'password', nullable: true })
  password: string | null;

  @Column('timestamp with time zone', {
    name: 'createdAt',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updatedAt',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.accounts, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: UserEntity;
}
