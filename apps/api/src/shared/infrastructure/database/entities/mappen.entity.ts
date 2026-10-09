// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { UserEntity } from './user.entity.js';

@Index('mappen_user_id_name_key', ['name', 'userId'], { unique: true })
@Index('mappen_user_id_idx', ['userId'], {})
@Entity('mappen', { schema: 'public' })
export class MappenEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'name', unique: true })
  name: string;

  @Column('text', { name: 'color', nullable: true })
  color: string | null;

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

  @OneToMany(() => DocumentsEntity, (documents) => documents.mappe)
  documents: DocumentsEntity[];

  @OneToMany(() => FoldersEntity, (folders) => folders.mappe)
  folders: FoldersEntity[];

  @ManyToOne(() => UserEntity, (user) => user.mappens, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
