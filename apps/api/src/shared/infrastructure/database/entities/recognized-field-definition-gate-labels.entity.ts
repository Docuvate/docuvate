// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RecognizedFieldDefinitionsEntity } from './recognized-field-definitions.entity.js';
import { TagsEntity } from './tags.entity.js';

@Index('recognized_field_definition_gate_labels_tag_idx', ['tagId'], {})
@Entity('recognized_field_definition_gate_labels', { schema: 'public' })
export class RecognizedFieldDefinitionGateLabelsEntity {
  @PrimaryColumn('uuid', { name: 'field_definition_id' })
  fieldDefinitionId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => RecognizedFieldDefinitionsEntity, (definition) => definition.gateLabels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'field_definition_id', referencedColumnName: 'id' }])
  fieldDefinition: RecognizedFieldDefinitionsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
