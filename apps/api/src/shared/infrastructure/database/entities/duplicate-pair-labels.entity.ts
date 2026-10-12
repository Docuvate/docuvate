// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { UserEntity } from './user.entity.js';

@Index('duplicate_pair_labels_user_pair_key', ['userId', 'documentIdA', 'documentIdB'], {
  unique: true,
})
@Entity('duplicate_pair_labels', { schema: 'public' })
export class DuplicatePairLabelsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'document_id_a' })
  documentIdA: string;

  @Column('uuid', { name: 'document_id_b' })
  documentIdB: string;

  @Column('text', { name: 'label' })
  label: string;

  @Column('real', { name: 'embedding_similarity' })
  embeddingSimilarity: number;

  @Column('real', { name: 'fraction_differing_tokens' })
  fractionDifferingTokens: number;

  @Column('real', { name: 'fraction_differing_value_tokens' })
  fractionDifferingValueTokens: number;

  @Column('real', { name: 'relative_page_count_diff' })
  relativePageCountDiff: number;

  @Column('real', { name: 'perceptual_page_hash_distance' })
  perceptualPageHashDistance: number;

  @Column('real', { name: 'shingle_jaccard_distance' })
  shingleJaccardDistance: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'document_id_a', referencedColumnName: 'id' }])
  documentA: DocumentsEntity;

  @ManyToOne(() => DocumentsEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'document_id_b', referencedColumnName: 'id' }])
  documentB: DocumentsEntity;
}
