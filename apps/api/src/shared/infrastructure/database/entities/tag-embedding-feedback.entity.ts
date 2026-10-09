// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';

@Index('tag_embedding_feedback_document_id_tag_id_action_key', ['action', 'documentId', 'tagId'], {
  unique: true,
})
@Entity('tag_embedding_feedback', { schema: 'public' })
export class TagEmbeddingFeedbackEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'document_id', unique: true })
  documentId: string;

  @Column('uuid', { name: 'tag_id', unique: true })
  tagId: string;

  @Column('text', { name: 'action', unique: true })
  action: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.tagEmbeddingFeedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, (tags) => tags.tagEmbeddingFeedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;

  @ManyToOne(() => UserEntity, (user) => user.tagEmbeddingFeedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
