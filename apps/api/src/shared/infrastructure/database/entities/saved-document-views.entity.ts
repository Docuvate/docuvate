// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CorrespondentsEntity } from './correspondents.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { MappenEntity } from './mappen.entity.js';
import { SavedDocumentViewTagsEntity } from './saved-document-view-tags.entity.js';
import { UserEntity } from './user.entity.js';

@Index('saved_document_views_owner_idx', ['ownerUserId'], {})
@Index('saved_document_views_visibility_idx', ['visibility'], {})
@Index('saved_document_views_owner_position_idx', ['ownerUserId', 'position'], {})
@Entity('saved_document_views', { schema: 'public' })
export class SavedDocumentViewsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'owner_user_id' })
  ownerUserId: string;

  @Column('text', { name: 'name' })
  name: string;

  @Column('text', { name: 'visibility', default: () => "'private'" })
  visibility: string;

  @Column('text', { name: 'search_query', default: () => "''" })
  searchQuery: string;

  @Column('text', { name: 'sort_field', default: () => "'updatedAt'" })
  sortField: string;

  @Column('text', { name: 'sort_order', default: () => "'desc'" })
  sortOrder: string;

  @Column('text', { name: 'view_mode', default: () => "'klassisch'" })
  viewMode: string;

  @Column('text', { name: 'filter_mode', default: () => "'ui'" })
  filterMode: string;

  @Column('text', { name: 'list_scope', default: () => "'all'" })
  listScope: string;

  @Column('uuid', { name: 'folder_id', nullable: true })
  folderId: string | null;

  @Column('uuid', { name: 'mappe_id', nullable: true })
  mappeId: string | null;

  @Column('uuid', { name: 'correspondent_id', nullable: true })
  correspondentId: string | null;

  @Column('text', { name: 'status_filter', nullable: true })
  statusFilter: string | null;

  @Column('boolean', { name: 'inbox_filter', nullable: true })
  inboxFilter: boolean | null;

  @Column('boolean', { name: 'without_non_inbox_label', nullable: true })
  withoutNonInboxLabel: boolean | null;

  @Column('date', { name: 'document_date_from', nullable: true })
  documentDateFrom: string | null;

  @Column('date', { name: 'document_date_to', nullable: true })
  documentDateTo: string | null;

  @Column('boolean', { name: 'pinned_sidebar', default: () => 'false' })
  pinnedSidebar: boolean;

  @Column('integer', { name: 'position', default: () => '0' })
  position: number;

  @Column('jsonb', {
    name: 'visible_columns',
    default: () => '\'["title","labels","date","status"]\'::jsonb',
  })
  visibleColumns: string[];

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'owner_user_id', referencedColumnName: 'id' }])
  ownerUser: UserEntity;

  @OneToMany(() => SavedDocumentViewTagsEntity, (row) => row.view)
  viewTags: SavedDocumentViewTagsEntity[];

  @ManyToOne(() => FoldersEntity, { onDelete: 'SET NULL' })
  @JoinColumn([{ name: 'folder_id', referencedColumnName: 'id' }])
  folder: FoldersEntity | null;

  @ManyToOne(() => MappenEntity, { onDelete: 'SET NULL' })
  @JoinColumn([{ name: 'mappe_id', referencedColumnName: 'id' }])
  mappe: MappenEntity | null;

  @ManyToOne(() => CorrespondentsEntity, { onDelete: 'SET NULL' })
  @JoinColumn([{ name: 'correspondent_id', referencedColumnName: 'id' }])
  correspondent: CorrespondentsEntity | null;
}
