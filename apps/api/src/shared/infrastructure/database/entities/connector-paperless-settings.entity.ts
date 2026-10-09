import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Entity('connector_paperless_settings', { schema: 'public' })
export class ConnectorPaperlessSettingsEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @Column('boolean', { name: 'keep_ocr_text', default: () => 'true' })
  keepOcrText: boolean;

  @Column('boolean', { name: 'rerun_ocr', default: () => 'false' })
  rerunOcr: boolean;

  @Column('boolean', { name: 'include_archived_pdf', default: () => 'false' })
  includeArchivedPdf: boolean;

  @Column('timestamp with time zone', { name: 'last_successful_modified_at', nullable: true })
  lastSuccessfulModifiedAt: Date | null;

  @OneToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
