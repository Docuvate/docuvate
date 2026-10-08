import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Index('document_field_values_pkey', ['id'], { unique: true })
@Index('document_field_values_user_idx', ['userId'], {})
@Index('document_field_values_document_idx', ['documentId'], {})
@Entity('document_field_values', { schema: 'public' })
export class DocumentFieldValuesEntity {
  @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'document_id' })
  documentId: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'field_storage_key' })
  fieldStorageKey: string;

  @Column('text', { name: 'field_label' })
  fieldLabel: string;

  @Column('text', { name: 'field_type' })
  fieldType: string;

  @Column('text', { name: 'value_text', default: () => "''" })
  valueText: string;

  @Column('text', { name: 'value_text_norm', nullable: true })
  valueTextNorm: string | null;

  @Column('numeric', { name: 'value_numeric', nullable: true })
  valueNumeric: string | null;

  @Column('date', { name: 'value_date', nullable: true })
  valueDate: string | null;

  @Column('timestamp with time zone', { name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
