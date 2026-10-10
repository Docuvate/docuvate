// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TagsEntity } from './tags.entity.js';
import { EmbeddingDensityLabelGroupEntity } from './embedding-density-label-group.entity.js';

@Entity('embedding_density_label_group_member', { schema: 'public' })
export class EmbeddingDensityLabelGroupMemberEntity {
  @PrimaryColumn('uuid', { name: 'group_id' })
  groupId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => EmbeddingDensityLabelGroupEntity, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'group_id', referencedColumnName: 'id' }])
  group: EmbeddingDensityLabelGroupEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
