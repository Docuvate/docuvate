// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { EnsureDocumentRepresentationUseCase } from './application/ensure-document-representation.use-case.js';
import { GetEncoderReindexProgressUseCase } from './application/get-encoder-reindex-progress.use-case.js';
import { PersistDocumentRepresentationUseCase } from './application/persist-document-representation.use-case.js';
import { ReindexStaleRepresentationUseCase } from './application/reindex-stale-representation.use-case.js';
import { EncoderReindexQueueService } from './infrastructure/encoder-reindex-queue.service.js';
import { PgDocumentRepresentationRepository } from './infrastructure/pg-document-representation.repository.js';
import { PgEncoderReindexRepository } from './infrastructure/pg-encoder-reindex.repository.js';

@Module({
  providers: [
    PgDocumentRepresentationRepository,
    PgEncoderReindexRepository,
    PersistDocumentRepresentationUseCase,
    EnsureDocumentRepresentationUseCase,
    ReindexStaleRepresentationUseCase,
    GetEncoderReindexProgressUseCase,
    EncoderReindexQueueService,
  ],
  exports: [
    PgDocumentRepresentationRepository,
    PersistDocumentRepresentationUseCase,
    EnsureDocumentRepresentationUseCase,
    GetEncoderReindexProgressUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class RepresentationModule {}
