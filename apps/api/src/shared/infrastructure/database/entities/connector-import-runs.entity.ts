// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Index('connector_import_runs_installation_idx', ['installationId', 'createdAt'])
@Entity('connector_import_runs', { schema: 'public' })
export class ConnectorImportRunsEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'installation_id' })
  installationId: string;

  @Column('text', { name: 'status' })
  status: string;

  @Column('integer', { name: 'paperless_api_version', nullable: true })
  paperlessApiVersion: number | null;

  @Column('text', { name: 'ocr_mode' })
  ocrMode: string;

  @Column('boolean', { name: 'include_archived_pdf', default: () => 'false' })
  includeArchivedPdf: boolean;

  @Column('integer', { name: 'progress_processed', default: () => '0' })
  progressProcessed: number;

  @Column('integer', { name: 'progress_total', nullable: true })
  progressTotal: number | null;

  @Column('integer', { name: 'resume_page', default: () => '1' })
  resumePage: number;

  @Column('timestamp with time zone', { name: 'resume_modified_cursor', nullable: true })
  resumeModifiedCursor: Date | null;

  @Column('timestamp with time zone', { name: 'incremental_modified_gt', nullable: true })
  incrementalModifiedGt: Date | null;

  @Column('text', { name: 'fatal_error_key', nullable: true })
  fatalErrorKey: string | null;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
