// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('duplicate_user_calibration', { schema: 'public' })
export class DuplicateUserCalibrationEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column('real', { name: 'logit_intercept_delta', default: () => '0' })
  logitInterceptDelta: number;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
