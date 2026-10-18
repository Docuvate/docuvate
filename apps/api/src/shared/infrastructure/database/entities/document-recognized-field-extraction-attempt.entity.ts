// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { RecognizedFieldDefinitionsEntity } from './recognized-field-definitions.entity.js';
import { UserEntity } from './user.entity.js';

@Index('document_recognized_field_extraction_attempt_tenant_document_idx', ['tenantId', 'documentId'])
@Entity('document_recognized_field_extraction_attempt', { schema: 'public' })
export class DocumentRecognizedFieldExtractionAttemptEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('uuid', { name: 'field_definition_id' })
  fieldDefinitionId: string;

  @Column('text', { name: 'tenant_id' })
  tenantId: string;

  @Column('text', { name: 'outcome' })
  outcome: string;

  @Column('real', { name: 'confidence', nullable: true, precision: 24 })
  confidence: number | null;

  @Column('integer', { name: 'extractor_version', default: () => '0' })
  extractorVersion: number;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => RecognizedFieldDefinitionsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'field_definition_id', referencedColumnName: 'id' }])
  fieldDefinition: RecognizedFieldDefinitionsEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tenant_id', referencedColumnName: 'id' }])
  tenant: UserEntity;
}
