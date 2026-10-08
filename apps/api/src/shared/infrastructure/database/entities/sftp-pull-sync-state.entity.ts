import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';

@Index('sftp_pull_sync_state_pkey', ['installationId'], { unique: true })
@Entity('sftp_pull_sync_state', { schema: 'public' })
export class SftpPullSyncStateEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @Column('timestamp with time zone', { name: 'last_run_at', nullable: true })
  lastRunAt: Date | null;

  @Column('text', { name: 'last_error_key', nullable: true })
  lastErrorKey: string | null;

  @OneToOne(
    () => ConnectorInstallationsEntity,
    (installation) => installation.sftpPullSyncState,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;
}
