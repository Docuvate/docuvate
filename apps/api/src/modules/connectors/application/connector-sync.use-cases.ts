// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { GetDocumentContentUseCase } from '../../documents/application/get-document-content.use-case.js';
import { UploadDocumentUseCase } from '../../documents/application/upload-document.use-case.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import type { ConnectorImportableItem } from '../domain/connector-runtime.types.js';
import { ConnectorRuntimeResolver } from './connector-runtime.resolver.js';

@Injectable()
export class ListConnectorImportablesUseCase {
  constructor(private readonly runtime: ConnectorRuntimeResolver) {}

  async execute(
    userId: string,
    installationId: string,
    limit = 20
  ): Promise<ConnectorImportableItem[]> {
    const resolved = await this.runtime.resolve(userId, installationId);
    if (!resolved.ports.source) {
      throw new ValidationError('connectors.errors.sourceNotSupported');
    }
    return resolved.ports.source.listImportables({ limit: Math.min(Math.max(limit, 1), 100) });
  }
}

@Injectable()
export class ImportFromConnectorUseCase {
  constructor(
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly uploadDocument: UploadDocumentUseCase
  ) {}

  async execute(userId: string, installationId: string, ref: string): Promise<DocumentEntity> {
    const trimmedRef = ref.trim();
    if (!trimmedRef) {
      throw new ValidationError('connectors.errors.importRefRequired');
    }
    const resolved = await this.runtime.resolve(userId, installationId);
    if (!resolved.ports.source) {
      throw new ValidationError('connectors.errors.sourceNotSupported');
    }
    const blob = await resolved.ports.source.fetchImportable(trimmedRef);
    if (blob.buffer.length === 0) {
      throw new ValidationError('connectors.errors.importEmpty');
    }
    return this.uploadDocument.execute({
      userId,
      filename: blob.filename,
      mimeType: blob.mimeType,
      buffer: blob.buffer,
    });
  }
}

@Injectable()
export class ExportToConnectorUseCase {
  constructor(
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    userId: string,
    installationId: string,
    documentId: string,
    subject: AuthorizationSubject,
    destinationRef?: string
  ): Promise<{ ref: string }> {
    const resolved = await this.runtime.resolve(userId, installationId);
    if (!resolved.ports.sink) {
      throw new ValidationError('connectors.errors.sinkNotSupported');
    }
    const content = await this.getDocumentContent.execute(documentId, userId, subject);
    if (!content.buffer.length) {
      throw new NotFoundError('Document');
    }
    const result = await resolved.ports.sink.exportDocument({
      documentId,
      filename: content.filename,
      mimeType: content.mimeType,
      buffer: content.buffer,
      destinationRef,
    });
    return { ref: result.ref };
  }
}
