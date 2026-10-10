// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { DocumentTagSuggestionsEntity } from './document-tag-suggestions.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { TagCustomFieldDefinitionsEntity } from './tag-custom-field-definitions.entity.js';
import { TagEmbeddingCentroidsEntity } from './tag-embedding-centroids.entity.js';
import { TagEmbeddingFeedbackEntity } from './tag-embedding-feedback.entity.js';
import { UserEntity } from './user.entity.js';

@Index('tags_user_id_name_key', ['name', 'userId'], { unique: true })
@Index('tags_user_id_idx', ['userId'], {})
@Index('tags_user_inbox_idx', ['userId'], { unique: true })
@Entity('tags', { schema: 'public' })
export class TagsEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'name', unique: true })
  name: string;

  @Column('text', { name: 'color', nullable: true })
  color: string | null;

  @Column('boolean', { name: 'is_inbox', default: () => 'false' })
  isInbox: boolean;

  @Column('text', { name: 'matching_algorithm', default: () => "'none'" })
  matchingAlgorithm: string;

  @Column('text', { name: 'match_text', default: () => "''" })
  matchText: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @OneToMany(
    () => DocumentTagSuggestionsEntity,
    (documentTagSuggestions) => documentTagSuggestions.tag
  )
  documentTagSuggestions: DocumentTagSuggestionsEntity[];

  @ManyToMany(() => DocumentsEntity, (documents) => documents.tags)
  documents: DocumentsEntity[];

  @OneToMany(
    () => ExtractionFieldCorrectionsEntity,
    (extractionFieldCorrections) => extractionFieldCorrections.fieldTag
  )
  extractionFieldCorrections: ExtractionFieldCorrectionsEntity[];

  @OneToMany(
    () => TagCustomFieldDefinitionsEntity,
    (tagCustomFieldDefinitions) => tagCustomFieldDefinitions.tag
  )
  tagCustomFieldDefinitions: TagCustomFieldDefinitionsEntity[];

  @OneToOne(() => TagEmbeddingCentroidsEntity, (tagEmbeddingCentroids) => tagEmbeddingCentroids.tag)
  tagEmbeddingCentroids: TagEmbeddingCentroidsEntity;

  @OneToMany(() => TagEmbeddingFeedbackEntity, (tagEmbeddingFeedback) => tagEmbeddingFeedback.tag)
  tagEmbeddingFeedbacks: TagEmbeddingFeedbackEntity[];

  @OneToOne(() => UserEntity, (user) => user.tags, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
