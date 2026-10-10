// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('label_recommendation_dismissals', { schema: 'public' })
export class LabelRecommendationDismissalsEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('text', { name: 'recommendation_key' })
  recommendationKey: string;

  @Column('timestamp with time zone', {
    name: 'dismissed_at',
    default: () => 'now()',
  })
  dismissedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.labelRecommendationDismissals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
