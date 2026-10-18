// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Index('passkey_userId_idx', ['userId'])
@Index('passkey_credentialID_unique_idx', ['credentialID'], { unique: true })
@Entity('passkey', { schema: 'public' })
export class PasskeyEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('text', { name: 'name', nullable: true })
  name: string | null;

  @Column('text', { name: 'publicKey' })
  publicKey: string;

  @Column('text', { name: 'userId' })
  userId: string;

  @Column('text', { name: 'credentialID' })
  credentialID: string;

  @Column('integer', { name: 'counter' })
  counter: number;

  @Column('text', { name: 'deviceType' })
  deviceType: string;

  @Column('boolean', { name: 'backedUp' })
  backedUp: boolean;

  @Column('text', { name: 'transports', nullable: true })
  transports: string | null;

  @Column('timestamp with time zone', {
    name: 'createdAt',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'aaguid', nullable: true })
  aaguid: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: UserEntity;
}
