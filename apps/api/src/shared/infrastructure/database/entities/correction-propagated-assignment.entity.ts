// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { CorrectionEntity } from './correction.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { TagsEntity } from './tags.entity.js';

@Entity('correction_propagated_assignments', { schema: 'public' })
export class CorrectionPropagatedAssignmentEntity {
  @PrimaryColumn('uuid', { name: 'correction_id' })
  correctionId: string;

  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @Column('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('boolean', { name: 'inbox_cleared' })
  inboxCleared: boolean;

  @ManyToOne(() => CorrectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'correction_id', referencedColumnName: 'id' }])
  correction: CorrectionEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
