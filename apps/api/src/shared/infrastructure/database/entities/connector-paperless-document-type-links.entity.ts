// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('connector_paperless_document_type_links', { schema: 'public' })
export class ConnectorPaperlessDocumentTypeLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
