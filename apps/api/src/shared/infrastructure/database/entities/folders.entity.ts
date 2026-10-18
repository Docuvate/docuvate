// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Index('folders_user_id_idx', ['userId'], {})
@Entity('folders', { schema: 'public' })
export class FoldersEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId: string | null;

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

  @OneToMany(() => DocumentsEntity, (documents) => documents.folder)
  documents: DocumentsEntity[];

  @ManyToOne(() => FoldersEntity, (folders) => folders.folders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'parent_id', referencedColumnName: 'id' }])
  parent: FoldersEntity;

  @OneToMany(() => FoldersEntity, (folders) => folders.parent)
  folders: FoldersEntity[];

  @ManyToOne(() => UserEntity, (user) => user.folders, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
