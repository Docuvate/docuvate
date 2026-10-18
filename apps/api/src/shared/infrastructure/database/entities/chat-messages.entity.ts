// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ChatThreadsEntity } from './chat-threads.entity.js';

@Index('chat_messages_thread_idx', ['createdAt', 'threadId'], {})
@Entity('chat_messages', { schema: 'public' })
export class ChatMessagesEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'thread_id' })
  threadId: string;

  @Column('text', { name: 'role' })
  role: string;

  @Column('text', { name: 'content' })
  content: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'generation_status', nullable: true })
  generationStatus: string | null;

  @Column('text', { name: 'generation_phase', nullable: true })
  generationPhase: string | null;

  @Column('text', { name: 'error_code', nullable: true })
  errorCode: string | null;

  @Column('text', { name: 'error_detail', nullable: true })
  errorDetail: string | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => ChatThreadsEntity, (chatThreads) => chatThreads.chatMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'thread_id', referencedColumnName: 'id' }])
  thread: ChatThreadsEntity;
}
