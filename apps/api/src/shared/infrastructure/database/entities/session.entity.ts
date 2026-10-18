// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Index('session_token_key', ['token'], { unique: true })
@Entity('session', { schema: 'public' })
export class SessionEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('timestamp with time zone', { name: 'expiresAt' })
  expiresAt: Date;

  @Column('text', { name: 'token', unique: true })
  token: string;

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

  @Column('text', { name: 'ipAddress', nullable: true })
  ipAddress: string | null;

  @Column('text', { name: 'userAgent', nullable: true })
  userAgent: string | null;

  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: UserEntity;
}
