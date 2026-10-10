// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { DuplicatesModule } from '../duplicates/duplicates.module.js';
import { LabelsModule } from '../labels/labels.module.js';
import { RecognizedFieldsModule } from '../recognized-fields/recognized-fields.module.js';
import { DocumentPipelineRegistry } from './application/document-pipeline.registry.js';
import { RunDocumentPostOcrPipelineUseCase } from './application/run-document-post-ocr-pipeline.use-case.js';
import {
  DuplicateDetectionDocumentPipelineStep,
  EmbeddingSuggestionsDocumentPipelineStep,
  GlobalRecognizedFieldsDocumentPipelineStep,
  LabelAttachedFieldsDocumentPipelineStep,
  LabelMatchingDocumentPipelineStep,
} from './infrastructure/nest-document-pipeline-modules.js';
import { DocumentPipelineController } from './presentation/document-pipeline.controller.js';

@Module({
  imports: [LabelsModule, DuplicatesModule, RecognizedFieldsModule],
  controllers: [DocumentPipelineController],
  providers: [
    DocumentPipelineRegistry,
    RunDocumentPostOcrPipelineUseCase,
    LabelMatchingDocumentPipelineStep,
    EmbeddingSuggestionsDocumentPipelineStep,
    GlobalRecognizedFieldsDocumentPipelineStep,
    LabelAttachedFieldsDocumentPipelineStep,
    DuplicateDetectionDocumentPipelineStep,
    {
      provide: 'DOCUMENT_PIPELINE_BOOTSTRAP',
      useFactory: (
        registry: DocumentPipelineRegistry,
        labelMatching: LabelMatchingDocumentPipelineStep,
        embedding: EmbeddingSuggestionsDocumentPipelineStep,
        globalFields: GlobalRecognizedFieldsDocumentPipelineStep,
        labelFields: LabelAttachedFieldsDocumentPipelineStep,
        duplicates: DuplicateDetectionDocumentPipelineStep
      ) => {
        registry.register(labelMatching);
        registry.register(embedding);
        registry.register(globalFields);
        registry.register(labelFields);
        registry.register(duplicates);
        return true;
      },
      inject: [
        DocumentPipelineRegistry,
        LabelMatchingDocumentPipelineStep,
        EmbeddingSuggestionsDocumentPipelineStep,
        GlobalRecognizedFieldsDocumentPipelineStep,
        LabelAttachedFieldsDocumentPipelineStep,
        DuplicateDetectionDocumentPipelineStep,
      ],
    },
  ],
  exports: [RunDocumentPostOcrPipelineUseCase],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class DocumentPipelineModule {}
