// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { MlRetrainJobsEntity } from './ml-retrain-jobs.entity.js';
import { MlTrainingDataSnapshotsEntity } from './ml-training-data-snapshots.entity.js';

@Entity('ml_model_families', { schema: 'public' })
export class MlModelFamiliesEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('text', { name: 'kind' })
  kind: string;

  @Column('text', { name: 'display_name' })
  displayName: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(() => MlModelVersionsEntity, (mlModelVersions) => mlModelVersions.family)
  mlModelVersions: MlModelVersionsEntity[];

  @OneToMany(() => MlRetrainJobsEntity, (mlRetrainJobs) => mlRetrainJobs.family)
  mlRetrainJobs: MlRetrainJobsEntity[];

  @OneToMany(
    () => MlTrainingDataSnapshotsEntity,
    (mlTrainingDataSnapshots) => mlTrainingDataSnapshots.family
  )
  mlTrainingDataSnapshots: MlTrainingDataSnapshotsEntity[];
}
