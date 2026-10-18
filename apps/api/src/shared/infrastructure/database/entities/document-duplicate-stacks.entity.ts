// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DocumentStackMembersEntity } from './document-stack-members.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('document_duplicate_stacks', { schema: 'public' })
export class DocumentDuplicateStacksEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

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

  @ManyToOne(() => UserEntity, (user) => user.documentDuplicateStacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @OneToOne(
    () => DocumentStackMembersEntity,
    (documentStackMembers) => documentStackMembers.stack,
    { onDelete: 'CASCADE' }
  )
  documentStackMembers: DocumentStackMembersEntity;
}
