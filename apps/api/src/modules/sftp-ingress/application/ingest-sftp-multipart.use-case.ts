// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { ValidationError } from '../../../shared/domain/errors.js';
import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import type { SftpIngressEventEntity } from '../domain/sftp-ingress.types.js';
import { IngestSftpScanUseCase } from './sftp-ingress.use-cases.js';

export interface IngestSftpMultipartInput {
  accountId: string;
  filename: string;
  remotePath: string | null;
  buffer: Buffer;
}

@Injectable()
export class IngestSftpMultipartUseCase {
  constructor(private readonly ingest: IngestSftpScanUseCase) {}

  async parseRequest(req: FastifyRequest): Promise<IngestSftpMultipartInput> {
    const multipart = await req.file();
    if (!multipart) {
      throw new ValidationError('No file uploaded');
    }
    const accountIdField = multipart.fields.accountId;
    const remotePathField = multipart.fields.remotePath;
    const accountId = isRecord(accountIdField) ? parseString(accountIdField.value) : '';
    const remotePathRaw = isRecord(remotePathField) ? parseString(remotePathField.value) : '';
    const remotePath = remotePathRaw.length > 0 ? remotePathRaw : null;
    if (!accountId.trim()) {
      throw new ValidationError('accountId required');
    }
    const buffer = await multipart.toBuffer();
    return {
      accountId: accountId.trim(),
      filename: multipart.filename,
      remotePath,
      buffer,
    };
  }

  execute(input: IngestSftpMultipartInput): Promise<{
    documentId: string | null;
    event: SftpIngressEventEntity;
  }> {
    return this.ingest.execute(input);
  }
}
