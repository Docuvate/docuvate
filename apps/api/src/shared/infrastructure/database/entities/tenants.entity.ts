// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tenants', { schema: 'public' })
export class TenantsEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'slug', unique: true })
  slug: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;
}
