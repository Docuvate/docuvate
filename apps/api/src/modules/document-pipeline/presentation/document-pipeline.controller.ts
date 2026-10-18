// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { AuthGuard } from '../../../shared/infrastructure/auth/auth.guard.js';
import { DocumentPipelineModulesResponseDto } from '../../../shared/presentation/dtos/document-pipeline.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { RunDocumentPostOcrPipelineUseCase } from '../application/run-document-post-ocr-pipeline.use-case.js';
import { OCR_PIPELINE_DESCRIPTOR } from '../domain/document-pipeline.types.js';

@ApiDocuvateController('settings')
@Controller('document-pipeline')
@UseGuards(AuthGuard)
export class DocumentPipelineController {
  constructor(private readonly postOcrPipeline: RunDocumentPostOcrPipelineUseCase) {}

  /** Read-only catalog for a future workflow UI (enable/order not persisted yet). */
  @Get('modules')
  @ApiDocuvateRoute({
    operationId: 'listDocumentPipelineModules',
    summary: 'List document pipeline module catalog',
    description:
      'Read-only module descriptors for OCR and post-OCR steps (order not persisted yet).',
  })
  @ApiOkResponse({ type: DocumentPipelineModulesResponseDto })
  listModules(): DocumentPipelineModulesResponseDto {
    const postOcr = this.postOcrPipeline.listModuleDescriptors().map((m) => ({
      id: m.id,
      label: m.labelDe,
      description: m.descriptionDe,
      defaultEnabled: m.defaultEnabled,
      defaultOrder: m.defaultOrder,
    }));
    return {
      modules: [
        {
          id: OCR_PIPELINE_DESCRIPTOR.id,
          label: OCR_PIPELINE_DESCRIPTOR.labelDe,
          description: OCR_PIPELINE_DESCRIPTOR.descriptionDe,
          defaultEnabled: OCR_PIPELINE_DESCRIPTOR.defaultEnabled,
          defaultOrder: OCR_PIPELINE_DESCRIPTOR.defaultOrder,
        },
        ...postOcr,
      ],
    };
  }
}
