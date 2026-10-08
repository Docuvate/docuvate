import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';

@Index('document_text_chunks_pkey', ['id'], { unique: true })
@Index('document_text_chunks_document_id_idx', ['documentId'], {})
@Entity('document_text_chunks', { schema: 'public' })
export class DocumentTextChunksEntity {
  @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('integer', { name: 'chunk_index' })
  chunkIndex: number;

  @Column('text', { name: 'body' })
  body: string;

  @Column('tsvector', { name: 'search_vector', nullable: true })
  searchVector: string | null;

  @Column('jsonb', { name: 'embedding', nullable: true })
  embedding: object | null;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
