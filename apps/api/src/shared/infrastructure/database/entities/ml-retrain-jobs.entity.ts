// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MlModelFamiliesEntity } from './ml-model-families.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { MlTrainingDataSnapshotsEntity } from './ml-training-data-snapshots.entity.js';

@Index('ml_retrain_jobs_family_status_idx', ['createdAt', 'familyId', 'status'], {})
@Entity('ml_retrain_jobs', { schema: 'public' })
export class MlRetrainJobsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'family_id' })
  familyId: string;

  @Column('text', { name: 'trigger_kind' })
  triggerKind: string;

  @Column('text', { name: 'status', default: () => "'queued'" })
  status: string;

  @Column('text', { name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @ManyToOne(() => MlModelFamiliesEntity, (mlModelFamilies) => mlModelFamilies.mlRetrainJobs)
  @JoinColumn([{ name: 'family_id', referencedColumnName: 'id' }])
  family: MlModelFamiliesEntity;

  @ManyToOne(() => MlModelVersionsEntity, (mlModelVersions) => mlModelVersions.mlRetrainJobs)
  @JoinColumn([{ name: 'result_version_id', referencedColumnName: 'id' }])
  resultVersion: MlModelVersionsEntity;

  @ManyToOne(
    () => MlTrainingDataSnapshotsEntity,
    (mlTrainingDataSnapshots) => mlTrainingDataSnapshots.mlRetrainJobs
  )
  @JoinColumn([{ name: 'training_snapshot_id', referencedColumnName: 'id' }])
  trainingSnapshot: MlTrainingDataSnapshotsEntity;
}
