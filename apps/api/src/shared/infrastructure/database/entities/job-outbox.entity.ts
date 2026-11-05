import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { JobTypesEntity } from './job-types.entity.js';

@Index('job_outbox_document_id_idx', ['documentId'], {})
@Index('job_outbox_relay_idx', ['status', 'nextAttemptAt', 'updatedAt'], {})
@Index('job_outbox_idempotency_key_key', ['idempotencyKey'], { unique: true })
@Entity('job_outbox', { schema: 'public' })
export class JobOutboxEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'job_type' })
  jobType: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('text', { name: 'idempotency_key' })
  idempotencyKey: string;

  @Column('text', { name: 'status', default: () => "'pending'" })
  status: string;

  @Column('integer', { name: 'attempts', default: () => '0' })
  attempts: number;

  @Column('integer', { name: 'max_attempts', default: () => '5' })
  maxAttempts: number;

  @Column('timestamp with time zone', {
    name: 'next_attempt_at',
    default: () => 'now()',
  })
  nextAttemptAt: Date;

  @Column('text', { name: 'last_error', nullable: true })
  lastError: string | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('timestamp with time zone', { name: 'enqueued_at', nullable: true })
  enqueuedAt: Date | null;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @ManyToOne(() => JobTypesEntity, (jobTypes) => jobTypes.jobOutboxes)
  @JoinColumn([{ name: 'job_type', referencedColumnName: 'code' }])
  jobTypeRelation: JobTypesEntity;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.jobOutboxes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;
}
