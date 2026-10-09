// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { UpdateDocumentRequest } from '@docuvate/contracts';
import {
  DOCUMENT_REPOSITORY,
  FOLDER_REPOSITORY,
  MAPPE_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type DocumentRepository,
  type FolderRepository,
  type MappeRepository,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { mergeDocumentPlacementPatch } from '../domain/document-placement.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { RecordExtractionFieldCorrectionsUseCase } from '../../extraction-feedback/application/record-extraction-field-corrections.use-case.js';
import { SyncDocumentSearchIndexUseCase } from '../../search/application/sync-document-search-index.use-case.js';

export interface UpdateDocumentResult {
  document: DocumentEntity;
  fieldCorrectionsRecorded: number;
}

@Injectable()
export class UpdateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(MAPPE_REPOSITORY) private readonly mappen: MappeRepository,
    private readonly recordFieldCorrections: RecordExtractionFieldCorrectionsUseCase,
    private readonly syncSearchIndex: SyncDocumentSearchIndexUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    body: UpdateDocumentRequest
  ): Promise<UpdateDocumentResult> {
    const existing = await this.documents.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Document');
    }

    const placementTouched = body.folderId !== undefined || body.mappeId !== undefined;
    const placement = placementTouched
      ? mergeDocumentPlacementPatch(
          { folderId: existing.folderId ?? null, mappeId: existing.mappeId ?? null },
          { folderId: body.folderId, mappeId: body.mappeId }
        )
      : null;

    if (placement?.folderId) {
      const folder = await this.folders.findByIdForUser(placement.folderId, userId);
      if (!folder) throw new NotFoundError('Folder');
    }
    if (placement?.mappeId) {
      const mappe = await this.mappen.findByIdForUser(placement.mappeId, userId);
      if (!mappe) throw new NotFoundError('Mappe');
    }
    if (body.correspondentId) {
      const c = await this.taxonomy.findCorrespondentByIdForUser(body.correspondentId, userId);
      if (!c) throw new NotFoundError('Correspondent');
    }
    if (body.tagIds) {
      for (const tagId of body.tagIds) {
        const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
        if (!tag) throw new NotFoundError('Tag');
      }
    }
    if (body.title !== undefined && !body.title.trim()) {
      throw new ValidationError('Title cannot be empty');
    }

    let documentDate: Date | null | undefined;
    if (body.documentDate !== undefined) {
      documentDate =
        body.documentDate === null ? null : new Date(`${body.documentDate}T12:00:00.000Z`);
    }

    const previousFields = existing.extraction?.fields ?? [];
    let fieldCorrectionsRecorded = 0;
    if (body.extractionFields !== undefined) {
      fieldCorrectionsRecorded = await this.recordFieldCorrections.execute(
        id,
        userId,
        previousFields,
        body.extractionFields
      );
    }

    const document = await this.documents.updateForUser(id, userId, {
      title: body.title?.trim(),
      documentDate,
      notes: body.notes,
      folderId: placement ? placement.folderId : undefined,
      mappeId: placement ? placement.mappeId : undefined,
      correspondentId: body.correspondentId,
      tagIds: body.tagIds,
      extractionFields: body.extractionFields,
      extractionBlocks: body.extractionBlocks,
    });

    const searchMetaTouched =
      body.title !== undefined ||
      body.extractionFields !== undefined ||
      body.extractionBlocks !== undefined;
    if (searchMetaTouched) {
      await this.syncSearchIndex.execute(userId, id, {
        text: document.extraction?.text ?? '',
        title: document.title,
        filename: document.filename,
      });
    }

    return { document, fieldCorrectionsRecorded };
  }
}
