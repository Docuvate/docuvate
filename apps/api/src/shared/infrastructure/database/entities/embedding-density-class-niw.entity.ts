// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('embedding_density_class_niw', { schema: 'public' })
export class EmbeddingDensityClassNiwEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('integer', { name: 'sample_count' })
  sampleCount: number;

  @Column('jsonb', { name: 'sum_x', nullable: true })
  sumX: number[] | null;

  @Column('jsonb', { name: 'sum_xx', nullable: true })
  sumXx: number[][] | null;

  @Column('bytea', { name: 'sum_x_f32', nullable: true })
  sumXF32: Buffer | null;

  @Column('bytea', { name: 'sum_xx_f32', nullable: true })
  sumXxF32: Buffer | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
