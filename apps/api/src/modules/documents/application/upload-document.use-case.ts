// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';

import { normalizeMimeType } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  CLOCK,
  type Clock,
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  FOLDER_REPOSITORY,
  type FolderRepository,
  ID_GENERATOR,
  type IdGenerator,
  OBJECT_STORAGE,
  type ObjectStorage,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { resolveAllowedUploadMime } from '../../../shared/domain/upload-mime-resolve.js';
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { resolveDocumentPlacement } from '../domain/document-placement.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

export interface UploadDocumentInput {
  userId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string | null;
  tagIds?: string[];
  ingestSource?: string | null;
}

export function isPlainTextUploadMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  return base === 'text/plain';
}

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly queueExtraction: QueueExtractionUseCase,
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase
  ) {}

  async execute(input: UploadDocumentInput): Promise<DocumentEntity> {
    if (!input.filename.trim()) {
      throw new ValidationError('Filename is required');
    }
    if (input.buffer.length === 0) {
      throw new ValidationError('File is empty');
    }

    const resolvedMime = resolveAllowedUploadMime(
      input.filename,
      input.mimeType,
      input.buffer
    );
    if (!resolvedMime) {
      throw new ValidationError(
        'This file format is not supported. Upload PDF, images, or common office documents (Word, Excel, PowerPoint, OpenDocument, RTF, CSV, text, HTML, or email).'
      );
    }
    const mimeType = normalizeMimeType(resolvedMime);

    const placement = resolveDocumentPlacement({
      folderId: input.folderId ?? null,
    });

    if (placement.folderId) {
      const folder = await this.folders.findByIdForUser(placement.folderId, input.userId);
      if (!folder) throw new NotFoundError('Folder');
    }

    const id = this.ids.generate();
    const storageKey = `users/${input.userId}/${id}/${input.filename}`;
    await this.storage.putObject(storageKey, input.buffer, mimeType);

    const skipInbox = input.ingestSource === 'scanner_sftp';
    const inboxTag = skipInbox ? null : await this.taxonomy.ensureInboxTag(input.userId);
    const extraTags = [];
    if (input.tagIds?.length) {
      for (const tagId of input.tagIds) {
        const tag = await this.taxonomy.findTagByIdForUser(tagId, input.userId);
        if (tag) extraTags.push(tag);
      }
    }
    const tags = skipInbox
      ? extraTags
      : inboxTag
        ? [inboxTag, ...extraTags.filter((t) => t.id !== inboxTag.id)]
        : extraTags;
    const now = this.clock.now();
    const doc: DocumentEntity = {
      id,
      userId: input.userId,
      filename: input.filename,
      title: input.filename,
      mimeType,
      fileSizeBytes: input.buffer.length,
      storageKey,
      status: 'uploaded',
      documentDate: null,
      notes: null,
      folderId: placement.folderId,
      tags,
      ingestSource: input.ingestSource ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.documents.create(doc);
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    await this.documents.setContentHash(saved.id, contentHash);
    await this.applyDuplicateDetection.execute(saved.id, input.userId, contentHash);
    if (isPlainTextUploadMime(mimeType)) {
      const text = input.buffer.toString('utf8');
      await this.documents.saveExtraction(saved.id, { text, fields: [], blocks: [] });
      await this.syncSearchIndex.execute(input.userId, saved.id, {
        text,
        title: saved.title,
        filename: saved.filename,
      });
      await this.documents.updateStatus(saved.id, 'ready');
    } else {
      await this.queueExtraction.execute(saved.id, input.userId);
    }
    return (await this.documents.findByIdForUser(saved.id, input.userId)) ?? saved;
  }
}
