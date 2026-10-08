import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentEntity } from '../domain/document.entity.js';
import {
  CLOCK,
  DOCUMENT_REPOSITORY,
  FOLDER_REPOSITORY,
  ID_GENERATOR,
  MAPPE_REPOSITORY,
  OBJECT_STORAGE,
  TAXONOMY_REPOSITORY,
  type Clock,
  type DocumentRepository,
  type FolderRepository,
  type IdGenerator,
  type MappeRepository,
  type ObjectStorage,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { ApplyDuplicateDetectionUseCase } from '../../duplicates/application/apply-duplicate-detection.use-case.js';
import { resolveDocumentPlacement } from '../domain/document-placement.js';
import { QueueExtractionUseCase } from './queue-extraction.use-case.js';

export interface UploadDocumentInput {
  userId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string | null;
  mappeId?: string | null;
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
    @Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly queueExtraction: QueueExtractionUseCase,
    private readonly applyDuplicateDetection: ApplyDuplicateDetectionUseCase
  ) {}

  async execute(input: UploadDocumentInput): Promise<DocumentEntity> {
    if (!input.filename.trim()) {
      throw new ValidationError('Filename is required');
    }
    if (input.buffer.length === 0) {
      throw new ValidationError('File is empty');
    }

    const placement = resolveDocumentPlacement({
      folderId: input.folderId ?? null,
      mappeId: input.mappeId ?? null,
    });

    if (placement.folderId) {
      const folder = await this.folders.findByIdForUser(placement.folderId, input.userId);
      if (!folder) throw new NotFoundError('Folder');
    }
    if (placement.mappeId) {
      const mappe = await this.mappen.findByIdForUser(placement.mappeId, input.userId);
      if (!mappe) throw new NotFoundError('Mappe');
    }

    const id = this.ids.generate();
    const storageKey = `users/${input.userId}/${id}/${input.filename}`;
    await this.storage.putObject(storageKey, input.buffer, input.mimeType);

    const inboxTag = await this.taxonomy.ensureInboxTag(input.userId);
    const now = this.clock.now();
    const doc: DocumentEntity = {
      id,
      userId: input.userId,
      filename: input.filename,
      title: input.filename,
      mimeType: input.mimeType,
      storageKey,
      status: 'uploaded',
      documentDate: null,
      notes: null,
      folderId: placement.folderId,
      mappeId: placement.mappeId,
      correspondent: null,
      tags: [inboxTag],
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.documents.create(doc);
    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    await this.documents.setContentHash(saved.id, contentHash);
    await this.applyDuplicateDetection.execute(saved.id, input.userId, contentHash);
    if (isPlainTextUploadMime(input.mimeType)) {
      const text = input.buffer.toString('utf8');
      await this.documents.saveExtraction(saved.id, { text, fields: [], blocks: [] });
      await this.documents.updateStatus(saved.id, 'ready');
    } else {
      await this.queueExtraction.execute(saved.id, input.userId);
    }
    return (await this.documents.findByIdForUser(saved.id, input.userId)) ?? saved;
  }
}
