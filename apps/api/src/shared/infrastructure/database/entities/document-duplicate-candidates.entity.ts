// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Index(
  'document_duplicate_candidates_document_id_candidate_documen_key',
  ['candidateDocumentId', 'documentId'],
  { unique: true }
)
@Index('document_duplicate_candidates_doc_idx', ['documentId'], {})
@Entity('document_duplicate_candidates', { schema: 'public' })
export class DocumentDuplicateCandidatesEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'document_id', unique: true })
  documentId: string;

  @Column('uuid', { name: 'candidate_document_id', unique: true })
  candidateDocumentId: string;

  @Column('real', { name: 'similarity', precision: 24 })
  similarity: number;

  @Column('text', { name: 'source' })
  source: string;

  @Column('boolean', { name: 'dismissed', default: () => 'false' })
  dismissed: boolean;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.documentDuplicateCandidates, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'candidate_document_id', referencedColumnName: 'id' }])
  candidateDocument: DocumentsEntity;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.documentDuplicateCandidates2, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => UserEntity, (user) => user.documentDuplicateCandidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
