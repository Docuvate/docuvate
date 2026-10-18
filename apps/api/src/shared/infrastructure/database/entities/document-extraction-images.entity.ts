// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('document_extraction_images_document_id_idx', ['documentId'])
@Index('document_extraction_images_document_position_key', ['documentId', 'position'], {
  unique: true,
})
@Entity('document_extraction_images', { schema: 'public' })
export class DocumentExtractionImagesEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'document_id' })
  documentId!: string;

  @Column('integer')
  position!: number;

  @Column('integer')
  page!: number;

  @Column('double precision')
  x!: number;

  @Column('double precision')
  y!: number;

  @Column('double precision')
  width!: number;

  @Column('double precision')
  height!: number;

  @Column('text')
  kind!: 'embedded' | 'figure';

  @Column('text', { nullable: true })
  caption!: string | null;

  @Column('text', { name: 'thumbnail_storage_key' })
  thumbnailStorageKey!: string;
}
