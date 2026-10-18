// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { SavedDocumentViewsEntity } from './saved-document-views.entity.js';

@Index('saved_document_view_field_filters_view_idx', ['viewId'], {})
@Entity('saved_document_view_field_filters', { schema: 'public' })
export class SavedDocumentViewFieldFiltersEntity {
  @PrimaryColumn('uuid', { name: 'view_id' })
  viewId: string;

  @PrimaryColumn('text', { name: 'field_key' })
  fieldKey: string;

  @Column('text', { name: 'value_text' })
  valueText: string;

  @ManyToOne(() => SavedDocumentViewsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'view_id', referencedColumnName: 'id' }])
  view: SavedDocumentViewsEntity;
}
