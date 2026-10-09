// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';

@Entity('document_layout_ir', { schema: 'public' })
export class DocumentLayoutIrEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @Column('smallint', { name: 'version' })
  version: number;

  @Column('jsonb', { name: 'ir' })
  ir: Record<string, unknown>;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToOne(() => DocumentsEntity, (document) => document.layoutIr, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
