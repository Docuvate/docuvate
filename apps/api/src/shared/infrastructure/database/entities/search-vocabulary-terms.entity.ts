// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Entity('search_vocabulary_terms', { schema: 'public' })
export class SearchVocabularyTermsEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('text', { name: 'term' })
  term: string;

  @Column('text', { name: 'source' })
  source: string;

  @Column('integer', { name: 'doc_frequency', default: () => '1' })
  docFrequency: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
