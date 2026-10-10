// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { SearchModule } from '../search/search.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyGlobalRecognizedFieldsUseCase } from './application/apply-global-recognized-fields.use-case.js';
import {
  ListRecognizedFieldsUseCase,
  ReplaceRecognizedFieldsUseCase,
} from './application/recognized-field.use-cases.js';
import { RecognizedFieldsController } from './presentation/recognized-fields.controller.js';

@Module({
  imports: [SettingsModule, SearchModule],
  controllers: [RecognizedFieldsController],
  providers: [
    ListRecognizedFieldsUseCase,
    ReplaceRecognizedFieldsUseCase,
    ApplyGlobalRecognizedFieldsUseCase,
  ],
  exports: [ApplyGlobalRecognizedFieldsUseCase],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class RecognizedFieldsModule {}
