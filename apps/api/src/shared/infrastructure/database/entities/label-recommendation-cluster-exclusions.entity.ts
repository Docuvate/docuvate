// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('label_recommendation_cluster_exclusions', { schema: 'public' })
export class LabelRecommendationClusterExclusionsEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('text', { name: 'label_key' })
  labelKey: string;

  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @Column('timestamp with time zone', {
    name: 'excluded_at',
    default: () => 'now()',
  })
  excludedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.labelRecommendationClusterExclusions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
