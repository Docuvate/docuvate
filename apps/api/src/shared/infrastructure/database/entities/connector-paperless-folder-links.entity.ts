// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('connector_paperless_folder_links', { schema: 'public' })
export class ConnectorPaperlessFolderLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('uuid', { name: 'folder_id' })
  folderId: string;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
