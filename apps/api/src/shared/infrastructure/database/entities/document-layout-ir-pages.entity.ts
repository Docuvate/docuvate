// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { DocumentLayoutIrEntity } from './document-layout-ir.entity.js';

@Entity('document_layout_ir_pages', { schema: 'public' })
export class DocumentLayoutIrPagesEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('integer', { name: 'page' })
  page: number;

  @Column('double precision', { name: 'width_pt' })
  widthPt: number;

  @Column('double precision', { name: 'height_pt' })
  heightPt: number;

  @ManyToOne(() => DocumentLayoutIrEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'documentId' }])
  layoutIr: DocumentLayoutIrEntity;
}
