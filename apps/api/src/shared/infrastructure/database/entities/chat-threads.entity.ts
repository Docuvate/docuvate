// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatMessagesEntity } from './chat-messages.entity.js';
import { ChatThreadDocumentsEntity } from './chat-thread-documents.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('chat_threads', { schema: 'public' })
export class ChatThreadsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'title', default: () => "'Neuer Chat'" })
  title: string;

  @Column('text', { name: 'scope', default: () => "'document'" })
  scope: string;

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

  @OneToMany(() => ChatMessagesEntity, (chatMessages) => chatMessages.thread)
  chatMessages: ChatMessagesEntity[];

  @OneToMany(() => ChatThreadDocumentsEntity, (chatThreadDocuments) => chatThreadDocuments.thread)
  chatThreadDocuments: ChatThreadDocumentsEntity[];

  @ManyToOne(() => UserEntity, (user) => user.chatThreads, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
