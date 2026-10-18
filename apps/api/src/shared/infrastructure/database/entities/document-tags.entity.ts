// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Entity, Index, PrimaryColumn } from 'typeorm';

@Index('document_tags_tag_id_idx', ['tagId'], {})
@Entity('document_tags', { schema: 'public' })
export class DocumentTagsEntity {
  @PrimaryColumn('uuid', { name: 'document_id' })
  documentId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;
}
