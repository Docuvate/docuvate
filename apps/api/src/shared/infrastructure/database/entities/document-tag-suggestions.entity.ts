// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { TagsEntity } from './tags.entity.js';

@Entity('document_tag_suggestions', { schema: 'public' })
export class DocumentTagSuggestionsEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('text', { name: 'reason', default: () => "''" })
  reason: string;

  @Column('boolean', { name: 'dismissed', default: () => 'false' })
  dismissed: boolean;

  @Column('text', { name: 'source', default: () => "'rule'" })
  source: string;

  @Column('real', { name: 'confidence', nullable: true, precision: 24 })
  confidence: number | null;

  @Column('text', { name: 'decision_tier', nullable: true })
  decisionTier: string | null;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.documentTagSuggestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, (tags) => tags.documentTagSuggestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
