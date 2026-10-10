// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity.js';
import { EmbeddingDensityCalibrationRunEntity } from './embedding-density-calibration-run.entity.js';
import { EmbeddingDensityLabelGroupMemberEntity } from './embedding-density-label-group-member.entity.js';

@Entity('embedding_density_label_group', { schema: 'public' })
export class EmbeddingDensityLabelGroupEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'calibration_run_id' })
  calibrationRunId: string;

  @Column('text', { name: 'name' })
  name: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => EmbeddingDensityCalibrationRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'calibration_run_id', referencedColumnName: 'id' }])
  calibrationRun: EmbeddingDensityCalibrationRunEntity;

  @OneToMany(() => EmbeddingDensityLabelGroupMemberEntity, (member) => member.group)
  members: EmbeddingDensityLabelGroupMemberEntity[];
}
