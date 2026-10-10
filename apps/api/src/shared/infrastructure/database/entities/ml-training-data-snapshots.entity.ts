// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MlModelFamiliesEntity } from './ml-model-families.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { MlRetrainJobsEntity } from './ml-retrain-jobs.entity.js';

@Index('ml_training_data_snapshots_family_id_dataset_version_key', ['datasetVersion', 'familyId'], {
  unique: true,
})
@Entity('ml_training_data_snapshots', { schema: 'public' })
export class MlTrainingDataSnapshotsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'family_id', unique: true })
  familyId: string;

  @Column('text', { name: 'dataset_version', unique: true })
  datasetVersion: string;

  @Column('timestamp with time zone', {
    name: 'source_watermark',
    nullable: true,
  })
  sourceWatermark: Date | null;

  @Column('integer', { name: 'row_count', default: () => '0' })
  rowCount: number;

  @Column('text', { name: 'storage_uri', nullable: true })
  storageUri: string | null;

  @Column('jsonb', { name: 'metadata', default: {} })
  metadata: object;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(() => MlModelVersionsEntity, (mlModelVersions) => mlModelVersions.trainingSnapshot)
  mlModelVersions: MlModelVersionsEntity[];

  @OneToMany(() => MlRetrainJobsEntity, (mlRetrainJobs) => mlRetrainJobs.trainingSnapshot)
  mlRetrainJobs: MlRetrainJobsEntity[];

  @ManyToOne(
    () => MlModelFamiliesEntity,
    (mlModelFamilies) => mlModelFamilies.mlTrainingDataSnapshots
  )
  @JoinColumn([{ name: 'family_id', referencedColumnName: 'id' }])
  family: MlModelFamiliesEntity;
}
