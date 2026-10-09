// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentEntity } from '../../modules/documents/domain/document.entity.js';
import { ForbiddenError } from '../domain/errors.js';
import {
  AUTHORIZATION_PORT,
  type AuthorizationAction,
  type AuthorizationPort,
  type AuthorizationSubject,
  type DocumentResourceAttributes,
} from '../domain/authorization.js';

export function documentResourceFromEntity(doc: DocumentEntity): DocumentResourceAttributes {
  return {
    ownerId: doc.userId,
    status: doc.status,
    tagIds: doc.tags.map((t) => t.id),
    folderId: doc.folderId ?? null,
    mappeId: doc.folder?.mappeId ?? null,
  };
}

@Injectable()
export class DocumentAuthorizationService {
  constructor(@Inject(AUTHORIZATION_PORT) private readonly authorization: AuthorizationPort) {}

  async assert(
    subject: AuthorizationSubject,
    action: AuthorizationAction,
    doc: DocumentEntity
  ): Promise<void> {
    const decision = await this.authorization.authorize({
      subject,
      action,
      resource: documentResourceFromEntity(doc),
    });
    if (decision === 'deny') {
      throw new ForbiddenError('Not authorized for this document');
    }
  }

  async assertCollection(
    subject: AuthorizationSubject,
    action: AuthorizationAction
  ): Promise<void> {
    const decision = await this.authorization.authorize({ subject, action });
    if (decision === 'deny') {
      throw new ForbiddenError('Not authorized');
    }
  }

  async filterDocuments(
    subject: AuthorizationSubject,
    documents: DocumentEntity[]
  ): Promise<DocumentEntity[]> {
    const kept: DocumentEntity[] = [];
    for (const doc of documents) {
      const decision = await this.authorization.authorize({
        subject,
        action: 'document:read',
        resource: documentResourceFromEntity(doc),
      });
      if (decision === 'allow') {
        kept.push(doc);
      }
    }
    return kept;
  }
}
