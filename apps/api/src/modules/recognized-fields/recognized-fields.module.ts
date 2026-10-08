import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import {
  ListRecognizedFieldsUseCase,
  ReplaceRecognizedFieldsUseCase,
} from './application/recognized-field.use-cases.js';
import { ApplyGlobalRecognizedFieldsUseCase } from './application/apply-global-recognized-fields.use-case.js';
import { RecognizedFieldsController } from './presentation/recognized-fields.controller.js';

@Module({
  imports: [SettingsModule],
  controllers: [RecognizedFieldsController],
  providers: [
    ListRecognizedFieldsUseCase,
    ReplaceRecognizedFieldsUseCase,
    ApplyGlobalRecognizedFieldsUseCase,
  ],
  exports: [ApplyGlobalRecognizedFieldsUseCase],
})
export class RecognizedFieldsModule {}
