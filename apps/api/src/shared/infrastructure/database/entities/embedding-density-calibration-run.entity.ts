// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';

@Entity('embedding_density_calibration_run', { schema: 'public' })
export class EmbeddingDensityCalibrationRunEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'model_version_id', nullable: true })
  modelVersionId: string | null;

  @Column('integer', { name: 'n_documents' })
  nDocuments: number;

  @Column('integer', { name: 'n_examples' })
  nExamples: number;

  @Column('real', { name: 'delta' })
  delta: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => MlModelVersionsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'model_version_id', referencedColumnName: 'id' }])
  modelVersion: MlModelVersionsEntity | null;
}
