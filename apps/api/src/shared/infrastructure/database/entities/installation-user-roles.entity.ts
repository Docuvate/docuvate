// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('installation_user_roles', { schema: 'public' })
export class InstallationUserRolesEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'role' })
  role: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
