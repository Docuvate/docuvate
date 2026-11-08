// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ApplyPageTransformRequest,
  ApplyPageTransformResponse,
  PageRotationQuarterTurns,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_PAGE_TRANSFORM_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentPageTransformRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { isUuid } from '../domain/parse-uuid.js';

function asQuarterTurns(value: number): PageRotationQuarterTurns {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }
  throw new ValidationError('documents.pageTransformInvalid');
}

@Injectable()
export class ApplyPageTransformUseCase {
  constructor(
    private readonly authorization: DocumentAuthorizationService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_PAGE_TRANSFORM_REPOSITORY)
    private readonly transforms: DocumentPageTransformRepository
  ) {}

  async execute(
    documentId: string,
    page: number,
    userId: string,
    subject: AuthorizationSubject,
    body: ApplyPageTransformRequest
  ): Promise<ApplyPageTransformResponse> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:write', doc);
    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError('documents.pageTransformInvalid');
    }
    if (!isUuid(body.id)) {
      throw new ValidationError('documents.correctionIdInvalid');
    }
    const turns = asQuarterTurns(body.rotationQuarterTurns);
    const deskew = body.deskewDeg ?? 0;
    if (deskew < -15 || deskew > 15) {
      throw new ValidationError('documents.pageTransformInvalid');
    }
    const transform = await this.transforms.upsertUserTransform({
      documentId,
      page,
      rotationQuarterTurns: turns,
      deskewDeg: deskew,
      userId,
      correctionId: body.id,
    });
    return { transform, correctionId: body.id };
  }
}
