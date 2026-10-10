// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { TagsEntity } from './tags.entity.js';

@Index('extraction_field_correction_labels_tag_idx', ['tagId'], {})
@Entity('extraction_field_correction_labels', { schema: 'public' })
export class ExtractionFieldCorrectionLabelsEntity {
  @PrimaryColumn('uuid', { name: 'correction_id' })
  correctionId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => ExtractionFieldCorrectionsEntity, (correction) => correction.labelTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'correction_id', referencedColumnName: 'id' }])
  correction: ExtractionFieldCorrectionsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
