// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { EmbeddingDensityCorrectionOffsetEntity } from './embedding-density-correction-offset.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('embedding_density_correction', { schema: 'public' })
export class EmbeddingDensityCorrectionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('uuid', { name: 'from_tag_id', nullable: true })
  fromTagId: string | null;

  @Column('uuid', { name: 'to_tag_id' })
  toTagId: string;

  @Column('uuid', { name: 'model_version_id', nullable: true })
  modelVersionId: string | null;

  @Column('text', { name: 'created_by' })
  createdBy: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('text', { name: 'status' })
  status: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'from_tag_id', referencedColumnName: 'id' }])
  fromTag: TagsEntity | null;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'to_tag_id', referencedColumnName: 'id' }])
  toTag: TagsEntity;

  @ManyToOne(() => MlModelVersionsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn([{ name: 'model_version_id', referencedColumnName: 'id' }])
  modelVersion: MlModelVersionsEntity | null;

  @OneToMany(() => EmbeddingDensityCorrectionOffsetEntity, (offset) => offset.correction)
  offsets: EmbeddingDensityCorrectionOffsetEntity[];
}
