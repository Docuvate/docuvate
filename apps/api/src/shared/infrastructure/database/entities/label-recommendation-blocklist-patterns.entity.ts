// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Index('label_recommendation_blocklist_patterns_user_id_pattern_key', ['pattern', 'userId'], {
  unique: true,
})
@Entity('label_recommendation_blocklist_patterns', { schema: 'public' })
export class LabelRecommendationBlocklistPatternsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'pattern', unique: true })
  pattern: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.labelRecommendationBlocklistPatterns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
