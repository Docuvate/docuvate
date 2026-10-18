// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Entity('connector_paperless_absender_links', { schema: 'public' })
export class ConnectorPaperlessAbsenderLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('text', { name: 'absender_name' })
  absenderName: string;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
