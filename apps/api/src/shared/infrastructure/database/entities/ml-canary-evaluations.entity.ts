// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';

@Entity('ml_canary_evaluations', { schema: 'public' })
export class MlCanaryEvaluationsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'metric_name' })
  metricName: string;

  @Column('double precision', {
    name: 'baseline_value',
    nullable: true,
    precision: 53,
  })
  baselineValue: number | null;

  @Column('double precision', {
    name: 'candidate_value',
    nullable: true,
    precision: 53,
  })
  candidateValue: number | null;

  @Column('double precision', { name: 'max_allowed_drop', precision: 53 })
  maxAllowedDrop: number;

  @Column('boolean', { name: 'passed' })
  passed: boolean;

  @Column('timestamp with time zone', {
    name: 'evaluated_at',
    default: () => 'now()',
  })
  evaluatedAt: Date;

  @ManyToOne(() => MlModelVersionsEntity, (mlModelVersions) => mlModelVersions.mlCanaryEvaluations)
  @JoinColumn([{ name: 'baseline_version_id', referencedColumnName: 'id' }])
  baselineVersion: MlModelVersionsEntity;

  @ManyToOne(
    () => MlModelVersionsEntity,
    (mlModelVersions) => mlModelVersions.mlCanaryEvaluations2,
    { onDelete: 'CASCADE', createForeignKeyConstraints: false }
  )
  @JoinColumn([{ name: 'version_id', referencedColumnName: 'id' }])
  version: MlModelVersionsEntity;
}
