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
import { RecognizedFieldDefinitionGateLabelsEntity } from './recognized-field-definition-gate-labels.entity.js';
import { UserEntity } from './user.entity.js';

@Index('recognized_field_definitions_user_id_field_key_key', ['fieldKey', 'userId'], {
  unique: true,
})
@Index('recognized_field_definitions_user_idx', ['userId'], {})
@Entity('recognized_field_definitions', { schema: 'public' })
export class RecognizedFieldDefinitionsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id', unique: true })
  userId: string;

  @Column('text', { name: 'field_key', unique: true })
  fieldKey: string;

  @Column('text', { name: 'label' })
  label: string;

  @Column('text', { name: 'field_type', default: () => "'text'" })
  fieldType: string;

  @Column('integer', { name: 'sort_order', default: () => '0' })
  sortOrder: number;

  @Column('boolean', {
    name: 'extract_for_all_documents',
    default: () => 'false',
  })
  extractForAllDocuments: boolean;

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

  @Column('text', { name: 'gate_label_match', default: () => "'all'" })
  gateLabelMatch: string;

  @Column('real', {
    name: 'min_label_confidence',
    nullable: true,
    precision: 24,
  })
  minLabelConfidence: number | null;

  @Column('boolean', { name: 'confidence_gate_enabled', nullable: true })
  confidenceGateEnabled: boolean | null;

  @OneToMany(
    () => RecognizedFieldDefinitionGateLabelsEntity,
    (gateLabels) => gateLabels.fieldDefinition
  )
  gateLabels: RecognizedFieldDefinitionGateLabelsEntity[];

  @ManyToOne(() => UserEntity, (user) => user.recognizedFieldDefinitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
