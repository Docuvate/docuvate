// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('search_vocabulary_document_terms', { schema: 'public' })
export class SearchVocabularyDocumentTermsEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('text', { name: 'term' })
  term: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
