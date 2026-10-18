// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Entity('connector_installation_source_paths', { schema: 'public' })
export class ConnectorInstallationSourcePathsEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('text', { name: 'path' })
  path: string;

  @ManyToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
