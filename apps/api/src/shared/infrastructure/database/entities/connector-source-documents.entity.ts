// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';
import { DocumentsEntity } from './documents.entity.js';

@Index('connector_source_documents_document_idx', ['documentId'])
@Entity('connector_source_documents', { schema: 'public' })
export class ConnectorSourceDocumentsEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('text', { name: 'source_document_id' })
  sourceDocumentId: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('text', { name: 'content_checksum' })
  contentChecksum: string;

  @Column('timestamp with time zone', { name: 'source_modified_at' })
  sourceModifiedAt: Date;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
