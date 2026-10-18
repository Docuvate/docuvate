// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Entity('connector_installation_source_scope', { schema: 'public' })
export class ConnectorInstallationSourceScopeEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @Column('text', { name: 'mode' })
  mode: 'all' | 'selected';

  @OneToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
