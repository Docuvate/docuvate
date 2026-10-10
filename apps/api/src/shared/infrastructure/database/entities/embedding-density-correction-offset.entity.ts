// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TagsEntity } from './tags.entity.js';
import { EmbeddingDensityCorrectionEntity } from './embedding-density-correction.entity.js';

@Entity('embedding_density_correction_offset', { schema: 'public' })
export class EmbeddingDensityCorrectionOffsetEntity {
  @PrimaryColumn('uuid', { name: 'correction_id' })
  correctionId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('real', { name: 'offset' })
  offset: number;

  @ManyToOne(() => EmbeddingDensityCorrectionEntity, (correction) => correction.offsets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'correction_id', referencedColumnName: 'id' }])
  correction: EmbeddingDensityCorrectionEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
