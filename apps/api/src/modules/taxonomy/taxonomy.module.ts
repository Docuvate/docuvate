// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { CorrespondentsController } from './presentation/correspondents.controller.js';
import { TaxonomyController } from './presentation/taxonomy.controller.js';
import {
  CreateCorrespondentUseCase,
  CreateTagUseCase,
  DeleteCorrespondentUseCase,
  DeleteTagUseCase,
  ListCorrespondentsUseCase,
  ListTagsUseCase,
  UpdateCorrespondentUseCase,
  UpdateTagUseCase,
} from './application/taxonomy.use-cases.js';

@Module({
  controllers: [TaxonomyController, CorrespondentsController],
  providers: [
    ListTagsUseCase,
    CreateTagUseCase,
    UpdateTagUseCase,
    DeleteTagUseCase,
    ListCorrespondentsUseCase,
    CreateCorrespondentUseCase,
    UpdateCorrespondentUseCase,
    DeleteCorrespondentUseCase,
  ],
})
export class TaxonomyModule {}
