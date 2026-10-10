// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TagsEntity } from './tags.entity.js';
import { EmbeddingDensityCalibrationRunEntity } from './embedding-density-calibration-run.entity.js';
import { EmbeddingDensityLabelGroupEntity } from './embedding-density-label-group.entity.js';

@Entity('embedding_density_decision_threshold', { schema: 'public' })
export class EmbeddingDensityDecisionThresholdEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'calibration_run_id' })
  calibrationRunId: string;

  @Column('text', { name: 'scope' })
  scope: string;

  @Column('uuid', { name: 'tag_id', nullable: true })
  tagId: string | null;

  @Column('uuid', { name: 'group_id', nullable: true })
  groupId: string | null;

  @Column('real', { name: 'threshold' })
  threshold: number;

  @Column('real', { name: 'lower_bound' })
  lowerBound: number;

  @ManyToOne(() => EmbeddingDensityCalibrationRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'calibration_run_id', referencedColumnName: 'id' }])
  calibrationRun: EmbeddingDensityCalibrationRunEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity | null;

  @ManyToOne(() => EmbeddingDensityLabelGroupEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([{ name: 'group_id', referencedColumnName: 'id' }])
  group: EmbeddingDensityLabelGroupEntity | null;
}
