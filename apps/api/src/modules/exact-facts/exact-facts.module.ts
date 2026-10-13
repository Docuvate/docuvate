// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { PersistDocumentFactsUseCase } from './application/persist-document-facts.use-case.js';
import { RebuildDocumentFactIndexUseCase } from './application/rebuild-document-fact-index.use-case.js';
import { DocumentFactIndexQueueService } from './infrastructure/document-fact-index-queue.service.js';
import { PgDocumentExtractedFactRepository } from './infrastructure/pg-document-extracted-fact.repository.js';

@Module({
  imports: [FeatureFlagsModule],
  providers: [
    PgDocumentExtractedFactRepository,
    PersistDocumentFactsUseCase,
    RebuildDocumentFactIndexUseCase,
    DocumentFactIndexQueueService,
  ],
  exports: [PersistDocumentFactsUseCase, RebuildDocumentFactIndexUseCase],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ExactFactsModule {}
