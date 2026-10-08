import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { SftpIngressAccountsEntity } from './sftp-ingress-accounts.entity.js';

@Index('sftp_ingress_events_pkey', ['id'], { unique: true })
@Index('sftp_ingress_events_account_idx', ['accountId', 'createdAt'], {})
@Entity('sftp_ingress_events', { schema: 'public' })
export class SftpIngressEventsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'account_id' })
  accountId: string;

  @Column('text', { name: 'filename' })
  filename: string;

  @Column('text', { name: 'remote_path', nullable: true })
  remotePath: string | null;

  @Column('text', { name: 'status' })
  status: string;

  @Column('text', { name: 'reason_key', nullable: true })
  reasonKey: string | null;

  @Column('text', { name: 'reason_detail', nullable: true })
  reasonDetail: string | null;

  @Column('uuid', { name: 'document_id', nullable: true })
  documentId: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => SftpIngressAccountsEntity, (account) => account.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'account_id', referencedColumnName: 'id' }])
  account: SftpIngressAccountsEntity;

  @ManyToOne(() => DocumentsEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity | null;
}
