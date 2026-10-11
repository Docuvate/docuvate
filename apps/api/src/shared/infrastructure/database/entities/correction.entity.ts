// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CorrectionLabelAssignmentEntity } from './correction-label-assignment.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('corrections', { schema: 'public' })
export class CorrectionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('text', { name: 'kind' })
  kind: string;

  @Column('text', { name: 'created_by' })
  createdBy: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'status' })
  status: string;

  @Column('timestamp with time zone', { name: 'withdrawn_at', nullable: true })
  withdrawnAt: Date | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @OneToOne(() => CorrectionLabelAssignmentEntity, (assignment) => assignment.correction)
  labelAssignment: CorrectionLabelAssignmentEntity;
}
