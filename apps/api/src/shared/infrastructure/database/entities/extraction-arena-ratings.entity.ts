// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DocumentsEntity } from './documents.entity.js';
import { ExtractionArenaRatingComparedEnginesEntity } from './extraction-arena-rating-compared-engines.entity.js';
import { UserEntity } from './user.entity.js';

@Index('extraction_arena_ratings_user_idx', ['createdAt', 'userId'], {})
@Entity('extraction_arena_ratings', { schema: 'public' })
export class ExtractionArenaRatingsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'winner_engine' })
  winnerEngine: string;

  @Column('smallint', { name: 'rating', nullable: true })
  rating: number | null;

  @Column('text', { name: 'source', default: () => "'manual'" })
  source: string;

  @Column('jsonb', { name: 'compare_snapshot', nullable: true })
  compareSnapshot: object | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @OneToMany(
    () => ExtractionArenaRatingComparedEnginesEntity,
    (comparedEngines) => comparedEngines.rating
  )
  comparedEngines: ExtractionArenaRatingComparedEnginesEntity[];

  @ManyToOne(() => DocumentsEntity, (documents) => documents.extractionArenaRatings, {
    onDelete: 'SET NULL',
  })
  @JoinColumn([{ name: 'document_id', referencedColumnName: 'id' }])
  document: DocumentsEntity;

  @ManyToOne(() => UserEntity, (user) => user.extractionArenaRatings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
