import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';

/** OCR layout blocks of a document in extraction order (`position`), ADR 015. */
@Index('document_extraction_blocks_pkey', ['documentId', 'position'], { unique: true })
@Entity('document_extraction_blocks', { schema: 'public' })
export class DocumentExtractionBlocksEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('integer', { name: 'position' })
  position: number;

  @Column('integer', { name: 'page' })
  page: number;

  @Column('integer', { name: 'block_index', nullable: true })
  blockIndex: number | null;

  @Column('double precision', { name: 'x', precision: 53 })
  x: number;

  @Column('double precision', { name: 'y', precision: 53 })
  y: number;

  @Column('double precision', { name: 'width', precision: 53 })
  width: number;

  @Column('double precision', { name: 'height', precision: 53 })
  height: number;

  @Column('text', { name: 'text', default: () => "''" })
  text: string;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
