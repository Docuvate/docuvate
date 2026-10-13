// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import { fetchWorkerJson } from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';
import { loadExtractionForDocuments } from '../../documents/infrastructure/document-extraction.persistence.js';
import { parseExtractedFacts } from '../infrastructure/parse-extracted-facts.js';
import { PersistDocumentFactsUseCase } from './persist-document-facts.use-case.js';

@Injectable()
export class RebuildDocumentFactIndexUseCase {
  private readonly logger = new Logger(RebuildDocumentFactIndexUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly persistFacts: PersistDocumentFactsUseCase
  ) {}

  async execute(documentId: string, tenantId: string): Promise<void> {
    const doc = await this.documents.findById(documentId);
    if (doc?.userId !== tenantId) {
      throw new NotFoundError('Document');
    }
    const extractions = await loadExtractionForDocuments(this.pool, [documentId]);
    const extraction = extractions.get(documentId);
    const text = doc.extraction?.text ?? '';
    if (!text.trim()) {
      await this.persistFacts.execute(tenantId, documentId, [], null);
      return;
    }
    let contentBase64: string | undefined;
    try {
      const buffer = await this.storage.getObject(doc.storageKey);
      contentBase64 = buffer.toString('base64');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Fact rebuild without object bytes for ${documentId}: ${message}`);
    }
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const response = await fetchWorkerJson(
      workerApiUrl(workerUrl, '/facts/build-from-text'),
      {
        method: 'POST',
        headers: workerRequestHeaders(),
        body: JSON.stringify({
          mime_type: doc.mimeType,
          text,
          content_base64: contentBase64,
          blocks: (extraction?.blocks ?? []).map((block) => ({
            page: block.page,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            text: block.text,
            blockIndex: block.blockIndex ?? null,
          })),
        }),
      },
      120_000
    );
    const row = isRecord(response) ? response : {};
    const facts = parseExtractedFacts(row.extractedFacts);
    const wallTimeMs =
      typeof row.wallTimeMs === 'number' && Number.isFinite(row.wallTimeMs)
        ? row.wallTimeMs
        : null;
    await this.persistFacts.execute(tenantId, documentId, facts, wallTimeMs);
  }
}
