// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ChatThreadsEntity } from './chat-threads.entity.js';
import { DocumentsEntity } from './documents.entity.js';
@Index('chat_thread_documents_document_idx', ['documentId'], {})
@Entity('chat_thread_documents', { schema: 'public' })
export class ChatThreadDocumentsEntity {
  @PrimaryColumn('uuid', { name: 'thread_id' })
  threadId: string;

  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @Column('timestamp with time zone', {
    name: 'linked_at',
    default: () => 'now()',
  })
  linkedAt: Date;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.chatThreadDocuments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => ChatThreadsEntity, (chatThreads) => chatThreads.chatThreadDocuments, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'thread_id', referencedColumnName: 'id' }])
  thread: ChatThreadsEntity;
}
