// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  CreateCorrespondentUseCase,
  CreateTagUseCase,
  DeleteCorrespondentUseCase,
  DeleteTagUseCase,
  ListCorrespondentsUseCase,
  ListTagsUseCase,
  SearchTagsUseCase,
  UpdateCorrespondentUseCase,
  UpdateTagUseCase,
} from './application/taxonomy.use-cases.js';
import { TaxonomyController } from './presentation/taxonomy.controller.js';

@Module({
  controllers: [TaxonomyController],
  providers: [
    ListTagsUseCase,
    SearchTagsUseCase,
    CreateTagUseCase,
    UpdateTagUseCase,
    DeleteTagUseCase,
    ListCorrespondentsUseCase,
    CreateCorrespondentUseCase,
    UpdateCorrespondentUseCase,
    DeleteCorrespondentUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class TaxonomyModule {}
