// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';

@Index('tag_custom_field_definitions_tag_id_field_key_key', ['fieldKey', 'tagId'], { unique: true })
@Index('tag_custom_field_definitions_tag_idx', ['tagId'], {})
@Entity('tag_custom_field_definitions', { schema: 'public' })
export class TagCustomFieldDefinitionsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'tag_id', unique: true })
  tagId: string;

  @Column('text', { name: 'field_key', unique: true })
  fieldKey: string;

  @Column('text', { name: 'label' })
  label: string;

  @Column('text', { name: 'field_type', default: () => "'text'" })
  fieldType: string;

  @Column('integer', { name: 'sort_order', default: () => '0' })
  sortOrder: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => TagsEntity, (tags) => tags.tagCustomFieldDefinitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;

  @ManyToOne(() => UserEntity, (user) => user.tagCustomFieldDefinitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
