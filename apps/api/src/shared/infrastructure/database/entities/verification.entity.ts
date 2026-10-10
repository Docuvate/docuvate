// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('verification', { schema: 'public' })
export class VerificationEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('text', { name: 'identifier' })
  identifier: string;

  @Column('text', { name: 'value' })
  value: string;

  @Column('timestamp with time zone', { name: 'expiresAt' })
  expiresAt: Date;

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
}
