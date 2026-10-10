// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Index('correspondents_user_id_name_key', ['name', 'userId'], { unique: true })
@Entity('correspondents', { schema: 'public' })
export class CorrespondentsEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'name', unique: true })
  name: string;

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

  @ManyToOne(() => UserEntity, (user) => user.correspondents, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @OneToMany(() => DocumentsEntity, (documents) => documents.correspondent)
  documents: DocumentsEntity[];
}
