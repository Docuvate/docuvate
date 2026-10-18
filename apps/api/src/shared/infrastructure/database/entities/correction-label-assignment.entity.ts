// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';

import { CorrectionEntity } from './correction.entity.js';
import { TagsEntity } from './tags.entity.js';

@Entity('correction_label_assignments', { schema: 'public' })
export class CorrectionLabelAssignmentEntity {
  @PrimaryColumn('uuid', { name: 'correction_id' })
  correctionId: string;

  @Column('uuid', { name: 'from_tag_id', nullable: true })
  fromTagId: string | null;

  @Column('uuid', { name: 'to_tag_id' })
  toTagId: string;

  @OneToOne(() => CorrectionEntity, (correction) => correction.labelAssignment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'correction_id', referencedColumnName: 'id' }])
  correction: CorrectionEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'from_tag_id', referencedColumnName: 'id' }])
  fromTag: TagsEntity | null;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'to_tag_id', referencedColumnName: 'id' }])
  toTag: TagsEntity;
}
