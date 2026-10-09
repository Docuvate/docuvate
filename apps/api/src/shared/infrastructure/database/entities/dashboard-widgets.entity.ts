// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedDocumentViewsEntity } from './saved-document-views.entity.js';
import { UserEntity } from './user.entity.js';

@Index('dashboard_widgets_user_position_idx', ['userId', 'position'], {})
@Entity('dashboard_widgets', { schema: 'public' })
export class DashboardWidgetsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'widget_type' })
  widgetType: string;

  @Column('integer', { name: 'position', default: () => '0' })
  position: number;

  @Column('smallint', { name: 'width_cols', default: () => '6' })
  widthCols: number;

  @Column('smallint', { name: 'height_rows', default: () => '2' })
  heightRows: number;

  @Column('uuid', { name: 'saved_view_id', nullable: true })
  savedViewId: string | null;

  @Column('smallint', { name: 'item_limit', nullable: true })
  itemLimit: number | null;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => SavedDocumentViewsEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([{ name: 'saved_view_id', referencedColumnName: 'id' }])
  savedView: SavedDocumentViewsEntity | null;
}
