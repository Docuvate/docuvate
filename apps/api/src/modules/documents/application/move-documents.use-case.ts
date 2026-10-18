// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MoveDocumentsRequest } from '@docuvate/contracts';
import { ERROR_CODES, errorCodeI18nKey } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  FOLDER_REPOSITORY,
  type FolderRepository,
} from '../../../shared/domain/ports.js';

export interface MoveDocumentsResult {
  affected: number;
  previousFolderIds: { documentId: string; folderId: string | null }[];
}

@Injectable()
export class MoveDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository
  ) {}

  async execute(userId: string, body: MoveDocumentsRequest): Promise<MoveDocumentsResult> {
    const documentIds = [...new Set(body.documentIds)];
    if (documentIds.length === 0) {
      throw new ValidationError(
        errorCodeI18nKey(ERROR_CODES.VALIDATION_FAILED),
        ERROR_CODES.VALIDATION_FAILED
      );
    }
    const folderId = body.folderId ?? null;
    if (folderId) {
      const folder = await this.folders.findByIdForUser(folderId, userId);
      if (!folder) throw new NotFoundError('Folder');
    }
    return this.documents.moveDocumentsToFolder(userId, documentIds, folderId);
  }
}
