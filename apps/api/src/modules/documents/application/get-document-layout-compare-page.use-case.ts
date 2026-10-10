// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import { workerLayoutComparePage } from '../../../shared/infrastructure/worker/layout-compare-worker.client.js';
import { layoutComparePageWorkerSchema } from '../../../shared/infrastructure/worker/layout-compare-worker.schema.js';
import { GetDocumentContentUseCase } from './get-document-content.use-case.js';
import { GetDocumentLayoutIrUseCase } from './get-document-layout-ir.use-case.js';
import type { LayoutComparePageResult } from './layout-compare.types.js';

@Injectable()
export class GetDocumentLayoutComparePageUseCase {
  constructor(
    private readonly getLayoutIr: GetDocumentLayoutIrUseCase,
    private readonly getDocumentContent: GetDocumentContentUseCase
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject,
    pageNumber: number,
    includeHeatmap: boolean
  ): Promise<LayoutComparePageResult> {
    const layoutIr = await this.getLayoutIr.execute(id, userId, subject);
    const pageCount = layoutIr.pages.length;
    if (!Number.isFinite(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new ValidationError('Seite liegt außerhalb des Dokuments.');
    }
    const { buffer } = await this.getDocumentContent.execute(id, userId, subject);
    const workerUrl = process.env.WORKER_URL ?? 'http://localhost:8000';
    const data = await workerLayoutComparePage(
      workerUrl,
      layoutIr,
      buffer.toString('base64'),
      pageNumber,
      includeHeatmap,
      layoutComparePageWorkerSchema
    );
    return {
      pageNumber: data.pageNumber,
      ssim: data.ssim,
      inkDeviation: data.inkDeviation,
      ssimFloor: data.ssimFloor,
      pageReliable: data.pageReliable,
      widthPx: data.widthPx,
      heightPx: data.heightPx,
      originalPngBase64: data.originalPngBase64,
      reconstructionPngBase64: data.reconstructionPngBase64,
      heatmapPngBase64: data.heatmapPngBase64,
      errorCode: data.errorCode,
    };
  }
}
