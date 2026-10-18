// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ExtractionArenaRatingsEntity } from './extraction-arena-ratings.entity.js';

@Entity('extraction_arena_rating_compared_engines', { schema: 'public' })
export class ExtractionArenaRatingComparedEnginesEntity {
  @PrimaryColumn('uuid', { name: 'rating_id' })
  ratingId: string;

  @PrimaryColumn('text', { name: 'engine_name' })
  engineName: string;

  @Column('integer', { name: 'sort_order', default: () => '0' })
  sortOrder: number;

  @ManyToOne(() => ExtractionArenaRatingsEntity, (rating) => rating.comparedEngines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'rating_id', referencedColumnName: 'id' }])
  rating: ExtractionArenaRatingsEntity;
}
