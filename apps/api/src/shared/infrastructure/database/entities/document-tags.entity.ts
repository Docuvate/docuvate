// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { TagsEntity } from './tags.entity.js';

@Index('document_tags_tag_id_idx', ['tagId'], {})
@Entity('document_tags', { schema: 'public' })
export class DocumentTagsEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('boolean', { name: 'user_confirmed', default: () => 'false' })
  userConfirmed: boolean;

  @ManyToOne(() => DocumentsEntity, (document) => document.documentTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, (tag) => tag.documentTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
