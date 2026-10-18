// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { EmbeddingDensityCalibrationRunEntity } from './embedding-density-calibration-run.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('embedding_density_user_state', { schema: 'public' })
export class EmbeddingDensityUserStateEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'model_version_id', nullable: true })
  modelVersionId: string | null;

  @Column('uuid', { name: 'active_calibration_run_id', nullable: true })
  activeCalibrationRunId: string | null;

  @Column('real', { name: 'temperature', default: () => '1' })
  temperature: number;

  @Column('real', { name: 'novelty_log_threshold', default: () => "'-Infinity'::real" })
  noveltyLogThreshold: number;

  @Column('boolean', { name: 'coarse_ready', default: () => 'false' })
  coarseReady: boolean;

  @Column('jsonb', { name: 'fine_ready_tag_ids', default: () => "'[]'::jsonb" })
  fineReadyTagIds: string[];

  @Column('jsonb', { name: 'class_bias', default: () => "'[]'::jsonb" })
  classBias: number[];

  @Column('real', { name: 'kernel_bandwidth', default: () => '0.5' })
  kernelBandwidth: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => MlModelVersionsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'model_version_id', referencedColumnName: 'id' }])
  modelVersion: MlModelVersionsEntity | null;

  @ManyToOne(() => EmbeddingDensityCalibrationRunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'active_calibration_run_id', referencedColumnName: 'id' }])
  activeCalibrationRun: EmbeddingDensityCalibrationRunEntity | null;
}
