// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { PersistDocumentRepresentationUseCase } from './application/persist-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from './infrastructure/pg-document-representation.repository.js';

@Module({
  providers: [PgDocumentRepresentationRepository, PersistDocumentRepresentationUseCase],
  exports: [PgDocumentRepresentationRepository, PersistDocumentRepresentationUseCase],
})
export class RepresentationModule {}
