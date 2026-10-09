// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';

/**
 * One extracted or confirmed field value per document and field storage key (ADR 015).
 * `value_text_norm`, `value_numeric` and `value_date` are search columns derived from `value_text`
 * and the field type on every write (documented denormalization, ADR 015 / ADR 016).
 */
@Index('document_field_values_pkey', ['documentId', 'fieldStorageKey'], { unique: true })
@Entity('document_field_values', { schema: 'public' })
export class DocumentFieldValuesEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('text', { name: 'field_storage_key' })
  fieldStorageKey: string;

  @Column('text', { name: 'value_text', default: () => "''" })
  valueText: string;

  @Column('real', { name: 'confidence', nullable: true, precision: 24 })
  confidence: number | null;

  @Column('text', { name: 'value_text_norm', nullable: true })
  valueTextNorm: string | null;

  @Column('numeric', { name: 'value_numeric', nullable: true })
  valueNumeric: string | null;

  @Column('date', { name: 'value_date', nullable: true })
  valueDate: string | null;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
