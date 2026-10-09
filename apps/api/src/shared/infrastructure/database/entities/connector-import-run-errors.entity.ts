import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConnectorImportRunsEntity } from './connector-import-runs.entity.js';

@Index('connector_import_run_errors_run_idx', ['runId', 'createdAt'])
@Entity('connector_import_run_errors', { schema: 'public' })
export class ConnectorImportRunErrorsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'run_id' })
  runId: string;

  @Column('text', { name: 'source_document_id' })
  sourceDocumentId: string;

  @Column('text', { name: 'message_key' })
  messageKey: string;

  @Column('text', { name: 'message_detail', nullable: true })
  messageDetail: string | null;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @ManyToOne(() => ConnectorImportRunsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'run_id', referencedColumnName: 'id' }])
  run: ConnectorImportRunsEntity;
}
