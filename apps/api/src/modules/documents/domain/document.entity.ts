// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionResult } from '@docuvate/contracts';

import type { FolderEntity } from '../../../shared/domain/ports.js';
import type { CorrespondentEntity, TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';

export type DocumentStatus = 'uploaded' | 'queued' | 'extracting' | 'ready' | 'failed';

export interface DocumentEntity {
  id: string;
  userId: string;
  filename: string;
  title: string;
  mimeType: string;
  storageKey: string;
  archivedStorageKey?: string | null;
  contentHash?: string | null;
  status: DocumentStatus;
  documentDate?: Date | null;
  notes?: string | null;
  folderId?: string | null;
  mappeId?: string | null;
  folder?: Pick<FolderEntity, 'id' | 'name' | 'mappeId'> | null;
  correspondent?: CorrespondentEntity | null;
  tags: TagEntity[];
  ingestSource?: string | null;
  createdAt: Date;
  updatedAt: Date;
  extraction?: ExtractionResult;
}
