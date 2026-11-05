import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { JobOutboxEntity } from './job-outbox.entity.js';

@Entity('job_types', { schema: 'public' })
export class JobTypesEntity {
  @PrimaryColumn('text', { name: 'code' })
  code: string;

  @Column('text', { name: 'queue_name' })
  queueName: string;

  @Column('text', { name: 'description' })
  description: string;

  @OneToMany(() => JobOutboxEntity, (jobOutbox) => jobOutbox.jobTypeRelation)
  jobOutboxes: JobOutboxEntity[];
}
