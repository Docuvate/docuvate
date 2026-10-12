// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { EnsureDocumentRepresentationUseCase } from './application/ensure-document-representation.use-case.js';
import { PersistDocumentRepresentationUseCase } from './application/persist-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from './infrastructure/pg-document-representation.repository.js';

@Module({
  providers: [
    PgDocumentRepresentationRepository,
    PersistDocumentRepresentationUseCase,
    EnsureDocumentRepresentationUseCase,
  ],
  exports: [
    PgDocumentRepresentationRepository,
    PersistDocumentRepresentationUseCase,
    EnsureDocumentRepresentationUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class RepresentationModule {}
