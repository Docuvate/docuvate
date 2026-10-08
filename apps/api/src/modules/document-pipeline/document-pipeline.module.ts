import { Module } from '@nestjs/common';
import { DocumentPipelineRegistry } from './application/document-pipeline.registry.js';
import { RunDocumentPostOcrPipelineUseCase } from './application/run-document-post-ocr-pipeline.use-case.js';
import { DocumentPipelineController } from './presentation/document-pipeline.controller.js';
import {
  DuplicateDetectionDocumentPipelineStep,
  EmbeddingSuggestionsDocumentPipelineStep,
  GlobalRecognizedFieldsDocumentPipelineStep,
  LabelAttachedFieldsDocumentPipelineStep,
  LabelMatchingDocumentPipelineStep,
} from './infrastructure/nest-document-pipeline-modules.js';
import { LabelsModule } from '../labels/labels.module.js';
import { DuplicatesModule } from '../duplicates/duplicates.module.js';
import { RecognizedFieldsModule } from '../recognized-fields/recognized-fields.module.js';

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
export class DocumentPipelineModule {}
